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
	goredis "github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"
	"github.com/spf13/cobra"

	"github.com/busexpress/pkg/health"
	"github.com/busexpress/pkg/idempotency"
	"github.com/busexpress/pkg/logging"
	"github.com/busexpress/pkg/metrics"
	"github.com/busexpress/pkg/middleware"

	"github.com/busexpress/services/payment/config"
	paymenthttp "github.com/busexpress/services/payment/internal/adapter/inbound/http"
	"github.com/busexpress/services/payment/internal/adapter/outbound/bookingclient"
	"github.com/busexpress/services/payment/internal/adapter/outbound/gateway"
	"github.com/busexpress/services/payment/internal/adapter/outbound/postgres"
	"github.com/busexpress/services/payment/internal/service"
)

func main() {
	rootCmd := &cobra.Command{Use: "payment-service", Short: "BusExpress Payment Service"}
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
		return fmt.Errorf("load config: %w", err)
	}

	logger := logging.NewLogger(cfg.Log.Level)
	metrics.Register()

	pool, err := newDBPool(cfg.Database.DSN, logger)
	if err != nil {
		return fmt.Errorf("database pool: %w", err)
	}
	defer pool.Close()

	if len(cfg.Redis.Addrs) == 0 {
		return fmt.Errorf("at least one redis address required")
	}
	redisClient := goredis.NewClient(&goredis.Options{Addr: cfg.Redis.Addrs[0]})
	defer redisClient.Close()
	idemStore := idempotency.NewStore(redisClient)

	repo := postgres.NewPostgresPaymentRepository(pool)
	gw := gateway.NewMockGateway()
	bookings := bookingclient.New(cfg.Booking.URL)
	svc := service.NewPaymentService(repo, gw, bookings)

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

	paymenthttp.RegisterRoutes(r, svc, []byte(cfg.JWT.Secret), idemStore)

	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	srv := &http.Server{
		Addr:              addr,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		logger.Info().Str("addr", addr).Msg("payment-service started")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- fmt.Errorf("server listen: %w", err)
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
	if err := srv.Shutdown(ctx); err != nil {
		return fmt.Errorf("shutdown: %w", err)
	}
	logger.Info().Msg("payment-service stopped")
	return nil
}

func newDBPool(dsn string, logger zerolog.Logger) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse dsn: %w", err)
	}
	cfg.MaxConns = 25
	cfg.MinConns = 5
	cfg.MaxConnLifetime = 30 * time.Minute
	cfg.MaxConnIdleTime = 5 * time.Minute

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		logger.Warn().Err(err).Msg("database ping failed at startup — continuing")
	}
	return pool, nil
}
