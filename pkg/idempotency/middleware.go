package idempotency

import (
	"bytes"
	"net/http"
	"time"
)

const (
	// HeaderKey is the HTTP header for the idempotency key.
	HeaderKey = "Idempotency-Key"
	// DefaultTTL is the default duration to cache idempotent responses (24 hours).
	DefaultTTL = 24 * time.Hour
)

type responseRecorder struct {
	http.ResponseWriter
	statusCode int
	body       bytes.Buffer
}

func (r *responseRecorder) WriteHeader(code int) {
	r.statusCode = code
	r.ResponseWriter.WriteHeader(code)
}

func (r *responseRecorder) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}

// Middleware returns a chi middleware that enforces idempotency.
// If the Idempotency-Key header is present, it checks the store for
// a cached response and returns it. Otherwise, it records and caches
// the response for subsequent replays.
func Middleware(store *Store) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := r.Header.Get(HeaderKey)
			if key == "" {
				next.ServeHTTP(w, r)
				return
			}

			ctx := r.Context()

			cached, found, err := store.Get(ctx, key)
			if err == nil && found {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(cached.StatusCode)
				_, _ = w.Write(cached.Body)
				return
			}

			rec := &responseRecorder{
				ResponseWriter: w,
				statusCode:     http.StatusOK,
			}

			next.ServeHTTP(rec, r)

			resp := &CachedResponse{
				StatusCode: rec.statusCode,
				Body:       rec.body.Bytes(),
			}
			_ = store.Set(ctx, key, resp, DefaultTTL)
		})
	}
}
