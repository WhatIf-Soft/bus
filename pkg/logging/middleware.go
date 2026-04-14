package logging

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/rs/zerolog"
)

// HTTPMiddleware returns a chi-compatible middleware that logs each request
// with method, path, status, duration, and request_id using zerolog.
func HTTPMiddleware(logger zerolog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

			ctx := WithLogger(r.Context(), logger)
			r = r.WithContext(ctx)

			next.ServeHTTP(ww, r)

			duration := time.Since(start)
			requestID := r.Context().Value(middleware.RequestIDKey)

			logger.Info().
				Str("method", r.Method).
				Str("path", r.URL.Path).
				Int("status", ww.Status()).
				Dur("duration", duration).
				Interface("request_id", requestID).
				Msg("request completed")
		})
	}
}
