package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/busexpress/pkg/response"

	apperrors "github.com/busexpress/pkg/errors"
)

type claimsKey struct{}

// JWTMiddleware returns a chi middleware that extracts and validates
// the JWT from the Authorization Bearer header, storing Claims in the context.
func JWTMiddleware(secret []byte) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				response.Error(w, apperrors.NewUnauthorized("missing authorization header"))
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				response.Error(w, apperrors.NewUnauthorized("invalid authorization format"))
				return
			}

			claims, err := ValidateToken(parts[1], secret)
			if err != nil {
				response.Error(w, err)
				return
			}

			ctx := context.WithValue(r.Context(), claimsKey{}, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// ClaimsFromContext extracts JWT Claims from the context.
func ClaimsFromContext(ctx context.Context) (*Claims, error) {
	claims, ok := ctx.Value(claimsKey{}).(*Claims)
	if !ok || claims == nil {
		return nil, apperrors.NewUnauthorized("no claims in context")
	}
	return claims, nil
}
