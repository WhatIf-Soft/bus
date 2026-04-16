package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
)

// CSRFToken generates a double-submit CSRF token and sets it as a SameSite
// cookie. For bearer-token-only APIs (like BusExpress), CSRF is not a direct
// threat — this is defense-in-depth for any future cookie-based session path.
//
// State-changing requests must include the token in the `X-CSRF-Token` header
// matching the cookie. Safe methods (GET, HEAD, OPTIONS) are always allowed.
func CSRFToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("_csrf")
		if err != nil {
			// Mint a new CSRF token.
			b := make([]byte, 16)
			_, _ = rand.Read(b)
			token := hex.EncodeToString(b)
			http.SetCookie(w, &http.Cookie{
				Name:     "_csrf",
				Value:    token,
				Path:     "/",
				HttpOnly: false,
				Secure:   r.TLS != nil,
				SameSite: http.SameSiteStrictMode,
				MaxAge:   86400,
			})
			next.ServeHTTP(w, r)
			return
		}

		// Safe methods always pass.
		if r.Method == http.MethodGet || r.Method == http.MethodHead || r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		// Validate the double-submit.
		headerToken := r.Header.Get("X-CSRF-Token")
		if headerToken == "" || headerToken != cookie.Value {
			http.Error(w, `{"success":false,"error":{"code":"CSRF","message":"CSRF token mismatch"}}`, http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}
