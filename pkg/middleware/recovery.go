package middleware

import (
	"net/http"
	"runtime/debug"

	"github.com/busexpress/pkg/logging"
	"github.com/busexpress/pkg/response"

	apperrors "github.com/busexpress/pkg/errors"
)

// Recovery returns a middleware that recovers from panics, logs the stack
// trace using zerolog, and returns a 500 Internal Server Error response.
func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				logger := logging.FromContext(r.Context())
				logger.Error().
					Interface("panic", rec).
					Str("stack", string(debug.Stack())).
					Msg("panic recovered")

				response.Error(w, apperrors.NewInternal("internal server error"))
			}
		}()

		next.ServeHTTP(w, r)
	})
}
