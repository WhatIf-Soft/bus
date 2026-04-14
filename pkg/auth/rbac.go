package auth

import (
	"net/http"

	"github.com/busexpress/pkg/response"

	apperrors "github.com/busexpress/pkg/errors"
)

// RequireRole returns a chi middleware that checks whether the authenticated
// user's role matches one of the allowed roles.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, err := ClaimsFromContext(r.Context())
			if err != nil {
				response.Error(w, err)
				return
			}

			if _, ok := allowed[claims.Role]; !ok {
				response.Error(w, apperrors.NewForbidden("insufficient permissions"))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
