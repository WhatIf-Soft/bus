package middleware

import (
	"context"
	"net/http"
	"time"
)

// Timeout returns a middleware that sets a deadline on the request context.
// Default timeout is 30 seconds if duration is zero.
func Timeout(duration time.Duration) func(http.Handler) http.Handler {
	if duration == 0 {
		duration = 30 * time.Second
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, cancel := context.WithTimeout(r.Context(), duration)
			defer cancel()

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
