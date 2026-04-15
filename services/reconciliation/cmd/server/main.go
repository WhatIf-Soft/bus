package main

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
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

// Config holds reconciliation-service settings.
type Config struct {
	Server struct {
		Host string
		Port int
	}
	Database struct {
		// PaymentsDSN points at the busexpress_payments database. Reconciliation
		// is intentionally read-only; it never writes payment rows.
		PaymentsDSN string `mapstructure:"payments_dsn"`
	}
	JWT struct {
		Secret string
	}
	Platform struct {
		// FeeBps is the platform commission in basis points (1% = 100 bps).
		FeeBps int `mapstructure:"fee_bps"`
	}
	Log struct {
		Level string
	}
}

func loadConfig() (*Config, error) {
	v := viper.New()
	v.SetConfigName("config")
	v.AddConfigPath(".")
	v.SetEnvPrefix("RECONCILIATION_SERVICE")
	v.AutomaticEnv()

	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.port", 4011)
	v.SetDefault("database.payments_dsn",
		"postgres://busexpress:busexpress_dev@localhost:5433/busexpress_payments?sslmode=disable")
	v.SetDefault("jwt.secret", "dev-secret-change-me")
	v.SetDefault("platform.fee_bps", 500) // 5 %
	v.SetDefault("log.level", "info")

	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("read config: %w", err)
		}
	}
	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("unmarshal config: %w", err)
	}
	return &cfg, nil
}

func main() {
	rootCmd := &cobra.Command{Use: "reconciliation-service", Short: "BusExpress Reconciliation Service"}
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
	cfg, err := loadConfig()
	if err != nil {
		return err
	}
	logger := logging.NewLogger(cfg.Log.Level)
	metrics.Register()

	pool, err := newDBPool(cfg.Database.PaymentsDSN, logger)
	if err != nil {
		return err
	}
	defer pool.Close()

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(logging.HTTPMiddleware(logger))
	r.Use(middleware.Recovery)
	r.Use(middleware.CORS())
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(metrics.HTTPMetrics)

	r.Get("/healthz", health.NewHandler())
	r.Get("/readyz", health.NewReadinessHandler(
		func(ctx context.Context) error { return pool.Ping(ctx) },
	))
	r.Handle("/metrics", metrics.NewHandler())

	r.Route("/api/v1/reconciliation", func(r chi.Router) {
		r.Use(auth.JWTMiddleware([]byte(cfg.JWT.Secret)))
		r.Use(auth.RequireRole("admin", "operateur", "agent_support"))

		r.Get("/summary", summaryHandler(pool, cfg.Platform.FeeBps))
		r.Get("/by-method", byMethodHandler(pool))
		r.Get("/by-day", byDayHandler(pool))
	})

	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	srv := &http.Server{
		Addr: addr, Handler: r,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	errCh := make(chan error, 1)
	go func() {
		logger.Info().Str("addr", addr).Int("fee_bps", cfg.Platform.FeeBps).Msg("reconciliation-service started")
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

type periodFilter struct {
	from time.Time
	to   time.Time
}

func parsePeriod(q url.Values) (periodFilter, error) {
	now := time.Now().UTC()
	p := periodFilter{from: now.AddDate(0, 0, -30), to: now}
	if v := q.Get("from"); v != "" {
		t, err := time.Parse("2006-01-02", v)
		if err != nil {
			return p, fmt.Errorf("invalid `from` (expected YYYY-MM-DD)")
		}
		p.from = t
	}
	if v := q.Get("to"); v != "" {
		t, err := time.Parse("2006-01-02", v)
		if err != nil {
			return p, fmt.Errorf("invalid `to` (expected YYYY-MM-DD)")
		}
		p.to = t.AddDate(0, 0, 1) // exclusive end
	}
	return p, nil
}

// SummaryResponse aggregates payments over the period.
type SummaryResponse struct {
	From             string `json:"from"`
	To               string `json:"to"`
	GrossCents       int64  `json:"gross_cents"`
	SuccessCount     int    `json:"success_count"`
	FailedCount      int    `json:"failed_count"`
	RefundedCount    int    `json:"refunded_count"`
	PlatformFeeBps   int    `json:"platform_fee_bps"`
	PlatformFeeCents int64  `json:"platform_fee_cents"`
	NetPayoutCents   int64  `json:"net_payout_cents"`
	Currency         string `json:"currency"`
}

func summaryHandler(pool *pgxpool.Pool, feeBps int) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		period, err := parsePeriod(r.URL.Query())
		if err != nil {
			response.Error(w, apperrors.NewValidation(err.Error()))
			return
		}
		const q = `
            SELECT
                COALESCE(SUM(amount_cents) FILTER (WHERE status = 'succeeded'), 0)::bigint,
                COUNT(*) FILTER (WHERE status = 'succeeded'),
                COUNT(*) FILTER (WHERE status = 'failed'),
                COUNT(*) FILTER (WHERE status = 'refunded'),
                COALESCE(MAX(currency), 'XOF')
            FROM payments
            WHERE created_at >= $1 AND created_at < $2`

		var gross int64
		var success, failed, refunded int
		var currency string
		if err := pool.QueryRow(r.Context(), q, period.from, period.to).
			Scan(&gross, &success, &failed, &refunded, &currency); err != nil {
			response.Error(w, fmt.Errorf("summary: %w", err))
			return
		}
		fee := gross * int64(feeBps) / 10_000
		net := gross - fee
		response.JSON(w, http.StatusOK, SummaryResponse{
			From: period.from.Format("2006-01-02"),
			To:   period.to.Add(-24 * time.Hour).Format("2006-01-02"),
			GrossCents: gross, SuccessCount: success, FailedCount: failed,
			RefundedCount: refunded, PlatformFeeBps: feeBps,
			PlatformFeeCents: fee, NetPayoutCents: net, Currency: currency,
		})
	}
}

type methodRow struct {
	Method     string `json:"method"`
	Count      int    `json:"count"`
	GrossCents int64  `json:"gross_cents"`
}

func byMethodHandler(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		period, err := parsePeriod(r.URL.Query())
		if err != nil {
			response.Error(w, apperrors.NewValidation(err.Error()))
			return
		}
		const q = `
            SELECT method::text, COUNT(*), COALESCE(SUM(amount_cents), 0)::bigint
            FROM payments
            WHERE status = 'succeeded' AND created_at >= $1 AND created_at < $2
            GROUP BY method
            ORDER BY 3 DESC`
		rows, err := pool.Query(r.Context(), q, period.from, period.to)
		if err != nil {
			response.Error(w, fmt.Errorf("by-method: %w", err))
			return
		}
		defer rows.Close()
		out := []methodRow{}
		for rows.Next() {
			var m methodRow
			if err := rows.Scan(&m.Method, &m.Count, &m.GrossCents); err != nil {
				response.Error(w, err)
				return
			}
			out = append(out, m)
		}
		response.JSON(w, http.StatusOK, map[string]any{"items": out})
	}
}

type dayRow struct {
	Day        string `json:"day"`
	Count      int    `json:"count"`
	GrossCents int64  `json:"gross_cents"`
}

func byDayHandler(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		period, err := parsePeriod(r.URL.Query())
		if err != nil {
			response.Error(w, apperrors.NewValidation(err.Error()))
			return
		}
		const q = `
            SELECT TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD'),
                   COUNT(*), COALESCE(SUM(amount_cents), 0)::bigint
            FROM payments
            WHERE status = 'succeeded' AND created_at >= $1 AND created_at < $2
            GROUP BY 1
            ORDER BY 1`
		rows, err := pool.Query(r.Context(), q, period.from, period.to)
		if err != nil {
			response.Error(w, fmt.Errorf("by-day: %w", err))
			return
		}
		defer rows.Close()
		out := []dayRow{}
		for rows.Next() {
			var d dayRow
			if err := rows.Scan(&d.Day, &d.Count, &d.GrossCents); err != nil {
				response.Error(w, err)
				return
			}
			out = append(out, d)
		}
		response.JSON(w, http.StatusOK, map[string]any{"items": out})
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
