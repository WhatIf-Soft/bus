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
	"github.com/spf13/viper"

	"github.com/busexpress/pkg/health"
	"github.com/busexpress/pkg/logging"
	"github.com/busexpress/pkg/metrics"
	"github.com/busexpress/pkg/middleware"

	gpshttp "github.com/busexpress/services/gps/internal/adapter/inbound/http"
	"github.com/busexpress/services/gps/internal/adapter/outbound/postgres"
	"github.com/busexpress/services/gps/internal/service"
)

func main() {
	rootCmd := &cobra.Command{Use: "gps-service", Short: "BusExpress GPS Service"}
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
	v.SetEnvPrefix("GPS_SERVICE")
	v.AutomaticEnv()
	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.port", 4013)
	v.SetDefault("database.dsn",
		"postgres://busexpress:busexpress_dev@localhost:5433/busexpress_gps?sslmode=disable")
	v.SetDefault("log.level", "info")
	_ = v.ReadInConfig()

	dsn := v.GetString("database.dsn")
	port := v.GetInt("server.port")
	host := v.GetString("server.host")
	logLevel := v.GetString("log.level")

	logger := logging.NewLogger(logLevel)
	metrics.Register()

	pool, err := newDBPool(dsn, logger)
	if err != nil {
		return err
	}
	defer pool.Close()

	repo := postgres.NewPostgresTrackingRepository(pool)
	svc := service.NewGPSService(repo)

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

	gpshttp.RegisterRoutes(r, svc)

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
		logger.Info().Str("addr", addr).Msg("gps-service started")
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
