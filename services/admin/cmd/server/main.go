package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/busexpress/pkg/auth"
	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/health"
	"github.com/busexpress/pkg/logging"
	"github.com/busexpress/pkg/metrics"
	"github.com/busexpress/pkg/middleware"
	"github.com/busexpress/pkg/response"
)

func main() {
	rootCmd := &cobra.Command{Use: "audit-service", Short: "BusExpress Audit Log Service"}
	serveCmd := &cobra.Command{Use: "serve", Short: "Start the HTTP server", RunE: runServe}
	rootCmd.AddCommand(serveCmd)
	if len(os.Args) == 1 {
		os.Args = append(os.Args, "serve")
	}
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}

func runServe(_ *cobra.Command, _ []string) error {
	v := viper.New()
	v.SetConfigName("config")
	v.AddConfigPath(".")
	v.SetEnvPrefix("AUDIT_SERVICE")
	v.AutomaticEnv()
	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.port", 4012)
	v.SetDefault("database.dsn",
		"postgres://busexpress:busexpress_dev@localhost:5433/busexpress_audit?sslmode=disable")
	v.SetDefault("jwt.secret", "dev-secret-change-me")
	v.SetDefault("hmac.secret", "dev-audit-hmac-chain-key")
	v.SetDefault("log.level", "info")
	_ = v.ReadInConfig()

	logger := logging.NewLogger(v.GetString("log.level"))
	metrics.Register()

	pool, err := newDBPool(v.GetString("database.dsn"), logger)
	if err != nil {
		return err
	}
	defer pool.Close()

	hmacKey := []byte(v.GetString("hmac.secret"))
	jwtSecret := []byte(v.GetString("jwt.secret"))

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(logging.HTTPMiddleware(logger))
	r.Use(middleware.Recovery)
	r.Use(middleware.SecureHeaders)
	r.Use(middleware.CORS())
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(metrics.HTTPMetrics)

	r.Get("/healthz", health.NewHandler())
	r.Get("/readyz", health.NewReadinessHandler(
		func(ctx context.Context) error { return pool.Ping(ctx) },
	))
	r.Handle("/metrics", metrics.NewHandler())

	// POST /api/v1/audit — append event (internal, no auth for MVP; production uses S2S JWT).
	r.Post("/api/v1/audit", appendHandler(pool, hmacKey))

	// GET /api/v1/audit — list events (admin-only).
	r.Route("/api/v1/audit", func(r chi.Router) {
		r.Use(auth.JWTMiddleware(jwtSecret))
		r.Use(auth.RequireRole("admin"))
		r.Get("/", listHandler(pool))
		r.Get("/verify", verifyHandler(pool, hmacKey))
	})

	host := v.GetString("server.host")
	port := v.GetInt("server.port")
	addr := fmt.Sprintf("%s:%d", host, port)
	srv := &http.Server{
		Addr: addr, Handler: r,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	errCh := make(chan error, 1)
	go func() {
		logger.Info().Str("addr", addr).Msg("audit-service started")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	select {
	case sig := <-quit:
		logger.Info().Str("signal", sig.String()).Msg("shutting down")
	case err := <-errCh:
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	return srv.Shutdown(ctx)
}

// --- Append ---

type appendRequest struct {
	Kind        string    `json:"kind"`
	ActorID     string    `json:"actor_id"`
	ActorRole   string    `json:"actor_role"`
	SubjectType string    `json:"subject_type"`
	SubjectID   *string   `json:"subject_id,omitempty"`
	Metadata    any       `json:"metadata,omitempty"`
}

func computeHMAC(key []byte, prevHMAC, payload string) string {
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(prevHMAC))
	mac.Write([]byte(payload))
	return hex.EncodeToString(mac.Sum(nil))
}

func appendHandler(pool *pgxpool.Pool, hmacKey []byte) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req appendRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, apperrors.NewValidation("invalid JSON"))
			return
		}
		if req.Kind == "" || req.ActorID == "" {
			response.Error(w, apperrors.NewValidation("kind and actor_id required"))
			return
		}

		ctx := r.Context()
		metaJSON, _ := json.Marshal(req.Metadata)

		// Fetch previous HMAC for chain.
		var prevHMAC string
		_ = pool.QueryRow(ctx,
			"SELECT hmac FROM audit_events ORDER BY seq DESC LIMIT 1",
		).Scan(&prevHMAC)

		id := uuid.New()
		payload := fmt.Sprintf("%s|%s|%s|%s|%s", id, req.Kind, req.ActorID, req.SubjectType, string(metaJSON))
		rowHMAC := computeHMAC(hmacKey, prevHMAC, payload)

		var subjectID *uuid.UUID
		if req.SubjectID != nil {
			s, err := uuid.Parse(*req.SubjectID)
			if err == nil {
				subjectID = &s
			}
		}
		actorID, _ := uuid.Parse(req.ActorID)
		actorRole := req.ActorRole
		if actorRole == "" {
			actorRole = "system"
		}

		_, err := pool.Exec(ctx, `
			INSERT INTO audit_events
				(id, kind, actor_id, actor_role, subject_type, subject_id, metadata, prev_hmac, hmac)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			id, req.Kind, actorID, actorRole, req.SubjectType, subjectID,
			metaJSON, prevHMAC, rowHMAC,
		)
		if err != nil {
			response.Error(w, fmt.Errorf("insert audit: %w", err))
			return
		}
		response.JSON(w, http.StatusCreated, map[string]string{
			"id": id.String(), "hmac": rowHMAC,
		})
	}
}

// --- List ---

func listHandler(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		limit, _ := strconv.Atoi(q.Get("limit"))
		if limit <= 0 {
			limit = 50
		}
		kind := q.Get("kind")

		var rows interface{ Next() bool; Scan(...any) error; Err() error; Close() }
		var err error
		if kind != "" {
			rows, err = pool.Query(r.Context(), `
				SELECT id, kind, actor_id, actor_role, subject_type, subject_id,
					   metadata, hmac, created_at
				FROM audit_events WHERE kind = $1
				ORDER BY seq DESC LIMIT $2`, kind, limit)
		} else {
			rows, err = pool.Query(r.Context(), `
				SELECT id, kind, actor_id, actor_role, subject_type, subject_id,
					   metadata, hmac, created_at
				FROM audit_events ORDER BY seq DESC LIMIT $1`, limit)
		}
		if err != nil {
			response.Error(w, err)
			return
		}
		defer rows.Close()

		type eventRow struct {
			ID          string    `json:"id"`
			Kind        string    `json:"kind"`
			ActorID     string    `json:"actor_id"`
			ActorRole   string    `json:"actor_role"`
			SubjectType string    `json:"subject_type"`
			SubjectID   *string   `json:"subject_id,omitempty"`
			Metadata    json.RawMessage `json:"metadata"`
			HMAC        string    `json:"hmac"`
			CreatedAt   time.Time `json:"created_at"`
		}
		out := []eventRow{}
		for rows.Next() {
			var e eventRow
			var sid *uuid.UUID
			if err := rows.Scan(&e.ID, &e.Kind, &e.ActorID, &e.ActorRole,
				&e.SubjectType, &sid, &e.Metadata, &e.HMAC, &e.CreatedAt); err != nil {
				response.Error(w, err)
				return
			}
			if sid != nil {
				s := sid.String()
				e.SubjectID = &s
			}
			out = append(out, e)
		}
		response.JSON(w, http.StatusOK, map[string]any{"events": out})
	}
}

// --- Verify chain ---

func verifyHandler(pool *pgxpool.Pool, hmacKey []byte) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := pool.Query(r.Context(), `
			SELECT id, kind, actor_id, subject_type, metadata, prev_hmac, hmac
			FROM audit_events ORDER BY seq ASC`)
		if err != nil {
			response.Error(w, err)
			return
		}
		defer rows.Close()

		var expectedPrev string
		total, valid := 0, 0
		for rows.Next() {
			var id, kind, actorID, subjectType, storedHMAC, prevHMAC string
			var meta json.RawMessage
			if err := rows.Scan(&id, &kind, &actorID, &subjectType, &meta, &prevHMAC, &storedHMAC); err != nil {
				response.Error(w, err)
				return
			}
			total++
			payload := fmt.Sprintf("%s|%s|%s|%s|%s", id, kind, actorID, subjectType, string(meta))
			computed := computeHMAC(hmacKey, expectedPrev, payload)
			if prevHMAC == expectedPrev && computed == storedHMAC {
				valid++
			}
			expectedPrev = storedHMAC
		}
		ok := total == valid
		response.JSON(w, http.StatusOK, map[string]any{
			"total": total, "valid": valid, "chain_intact": ok,
		})
	}
}

func newDBPool(dsn string, logger zerolog.Logger) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, err
	}
	cfg.MaxConns = 10
	cfg.MinConns = 2
	cfg.MaxConnLifetime = 30 * time.Minute
	cfg.MaxConnIdleTime = 5 * time.Minute
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		logger.Warn().Err(err).Msg("database ping failed at startup — continuing")
	}
	return pool, nil
}
