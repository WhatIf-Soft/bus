package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
	"github.com/spf13/cobra"

	"github.com/busexpress/pkg/health"
	"github.com/busexpress/pkg/logging"
	"github.com/busexpress/pkg/metrics"
	"github.com/busexpress/pkg/middleware"

	"github.com/busexpress/services/waitlist/config"
	waitlisthttp "github.com/busexpress/services/waitlist/internal/adapter/inbound/http"
	"github.com/busexpress/services/waitlist/internal/adapter/outbound/notifclient"
	"github.com/busexpress/services/waitlist/internal/adapter/outbound/postgres"
	"github.com/busexpress/services/waitlist/internal/adapter/outbound/searchclient"
	"github.com/busexpress/services/waitlist/internal/port"
	"github.com/busexpress/services/waitlist/internal/service"
)

func main() {
	rootCmd := &cobra.Command{Use: "waitlist-service", Short: "BusExpress Waitlist Service"}
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
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	logger := logging.NewLogger(cfg.Log.Level)
	metrics.Register()

	pool, err := newDBPool(cfg.Database.DSN, logger)
	if err != nil {
		return err
	}
	defer pool.Close()

	repo := postgres.NewPostgresWaitlistRepository(pool)
	trips := searchclient.New(cfg.Search.URL)
	notifier := notifclient.New(cfg.Notification.URL)
	svc := service.NewWaitlistService(repo, trips, notifier)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(logging.HTTPMiddleware(logger))
	r.Use(middleware.Recovery)
	r.Use(middleware.SecureHeaders)
	r.Use(middleware.CORS())
	r.Use(middleware.RateLimit(middleware.DefaultRateLimitConfig()))
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(metrics.HTTPMetrics)

	r.Get("/healthz", health.NewHandler())
	r.Get("/readyz", health.NewReadinessHandler(
		func(ctx context.Context) error { return pool.Ping(ctx) },
	))
	r.Handle("/metrics", metrics.NewHandler())

	waitlisthttp.RegisterRoutes(r, svc, []byte(cfg.JWT.Secret))

	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	srv := &http.Server{
		Addr: addr, Handler: r,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	sweeperCtx, stopSweeper := context.WithCancel(context.Background())
	defer stopSweeper()
	go runSweeper(sweeperCtx, repo, logger)

	errCh := make(chan error, 1)
	go func() {
		logger.Info().Str("addr", addr).Msg("waitlist-service started")
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

// runSweeper expires waitlist entries that were notified but missed the
// 15-minute confirm deadline (CLAUDE.md §7.5).
func runSweeper(ctx context.Context, repo port.WaitlistRepository, logger zerolog.Logger) {
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			n, err := repo.ExpireNotified(ctx, time.Now().UTC())
			if err != nil {
				logger.Warn().Err(err).Msg("sweeper: expire notified failed")
				continue
			}
			if n > 0 {
				logger.Info().Int("expired", n).Msg("sweeper: expired notified waitlist entries")
			}
		}
	}
}

func newDBPool(dsn string, logger zerolog.Logger) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, err
	}
	cfg.MaxConns = 25
	cfg.MinConns = 5
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
