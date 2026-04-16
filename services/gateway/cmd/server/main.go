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

	"github.com/busexpress/pkg/auth"
	"github.com/busexpress/pkg/health"
	"github.com/busexpress/pkg/logging"
	"github.com/busexpress/pkg/metrics"
	"github.com/busexpress/pkg/middleware"

	gwhttp "github.com/busexpress/services/gateway/internal/adapter/inbound/http"
)

func main() {
	rootCmd := &cobra.Command{Use: "gateway-service", Short: "BusExpress API Gateway"}
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
	v.SetEnvPrefix("GATEWAY_SERVICE")
	v.AutomaticEnv()
	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.port", 4000)
	v.SetDefault("database.dsn",
		"postgres://busexpress:busexpress_dev@localhost:5433/busexpress_gateway?sslmode=disable")
	v.SetDefault("jwt.secret", "dev-secret-change-me")
	v.SetDefault("log.level", "info")
	_ = v.ReadInConfig()

	dsn := v.GetString("database.dsn")
	jwtSecret := []byte(v.GetString("jwt.secret"))
	logger := logging.NewLogger(v.GetString("log.level"))
	metrics.Register()

	pool, err := newDBPool(dsn, logger)
	if err != nil {
		return err
	}
	defer pool.Close()

	gw := gwhttp.NewGatewayHandler(pool)

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

	// Public key validation endpoint.
	r.Get("/api/v1/gateway/validate", gw.ValidateKey)

	// Admin-only key management.
	r.Route("/api/v1/gateway/keys", func(r chi.Router) {
		r.Use(auth.JWTMiddleware(jwtSecret))
		r.Use(auth.RequireRole("admin"))
		r.Post("/", gw.CreateKey)
		r.Get("/", gw.ListKeys)
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
		logger.Info().Str("addr", addr).Msg("gateway-service started")
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
