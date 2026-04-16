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
	bxredis "github.com/busexpress/pkg/redis"

	"github.com/busexpress/services/booking/config"
	bookinghttp "github.com/busexpress/services/booking/internal/adapter/inbound/http"
	"github.com/busexpress/services/booking/internal/adapter/outbound/postgres"
	"github.com/busexpress/services/booking/internal/adapter/outbound/searchclient"
	"github.com/busexpress/services/booking/internal/port"
	"github.com/busexpress/services/booking/internal/service"
)

func main() {
	rootCmd := &cobra.Command{
		Use:   "booking-service",
		Short: "BusExpress Booking Service",
	}
	serveCmd := &cobra.Command{
		Use:   "serve",
		Short: "Start the HTTP server",
		RunE:  runServe,
	}
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
	redisClients := make([]*goredis.Client, 0, len(cfg.Redis.Addrs))
	for _, addr := range cfg.Redis.Addrs {
		redisClients = append(redisClients, goredis.NewClient(&goredis.Options{Addr: addr}))
	}
	defer func() {
		for _, c := range redisClients {
			_ = c.Close()
		}
	}()

	redlock := bxredis.NewRedlock(redisClients)
	idemStore := idempotency.NewStore(redisClients[0])

	repo := postgres.NewPostgresBookingRepository(pool)
	tripClient := searchclient.NewClient(cfg.Search.URL)
	svc := service.NewBookingService(repo, tripClient, redlock, service.Config{
		LockTTL:     cfg.Lock.TTL,
		WaitlistURL: cfg.Waitlist.URL,
	})

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

	bookinghttp.RegisterRoutes(r, svc, []byte(cfg.JWT.Secret), idemStore)

	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	srv := &http.Server{
		Addr:              addr,
		Handler:           r,
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
		logger.Info().Str("addr", addr).Msg("booking-service started")
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
	logger.Info().Msg("booking-service stopped")
	return nil
}

func runSweeper(ctx context.Context, repo port.BookingRepository, logger zerolog.Logger) {
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			n, err := repo.ExpirePendingSeats(ctx, time.Now().UTC())
			if err != nil {
				logger.Warn().Err(err).Msg("sweeper: expire pending seats failed")
				continue
			}
			if n > 0 {
				logger.Info().Int("expired", n).Msg("sweeper: expired pending bookings")
			}
		}
	}
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
