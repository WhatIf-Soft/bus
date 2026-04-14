package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog"

	"github.com/busexpress/pkg/health"
	"github.com/busexpress/pkg/logging"
	"github.com/busexpress/pkg/metrics"
	"github.com/busexpress/pkg/middleware"
)

func main() {
	logger := logging.NewLogger("info")
	metrics.Register()

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(logging.HTTPMiddleware(logger))
	r.Use(middleware.Recovery)
	r.Use(middleware.CORS())
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(metrics.HTTPMetrics)

	r.Get("/healthz", health.NewHandler())
	r.Handle("/metrics", metrics.NewHandler())

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		logger.Info().Str("port", port).Msg("api-gateway started on :" + port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal().Err(err).Msg("server failed")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	sig := <-quit

	logger.Info().Str("signal", sig.String()).Msg("shutting down server")

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal().Err(err).Msg("server forced to shutdown")
	}

	logger.Info().Msg("server stopped")

	_ = zerolog.Nop()
}
