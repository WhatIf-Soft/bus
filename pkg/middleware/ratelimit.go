package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/busexpress/pkg/response"

	apperrors "github.com/busexpress/pkg/errors"
)

// RateLimitConfig holds rate limiting parameters.
type RateLimitConfig struct {
	AuthRate  int           // tokens per interval for authenticated users
	AnonRate  int           // tokens per interval for anonymous users
	Interval  time.Duration // refill interval
	BurstSize int           // max bucket capacity
}

// DefaultRateLimitConfig returns rate limits matching the BusExpress spec:
// 100 req/min for authenticated, 20 req/min for anonymous.
func DefaultRateLimitConfig() RateLimitConfig {
	return RateLimitConfig{
		AuthRate:  100,
		AnonRate:  20,
		Interval:  time.Minute,
		BurstSize: 0, // 0 means use rate as burst size
	}
}

type bucket struct {
	tokens    float64
	lastCheck time.Time
	rate      float64
	mu        sync.Mutex
}

func (b *bucket) allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(b.lastCheck).Seconds()
	b.lastCheck = now

	b.tokens += elapsed * (b.rate / 60.0)
	if b.tokens > b.rate {
		b.tokens = b.rate
	}

	if b.tokens < 1.0 {
		return false
	}

	b.tokens--
	return true
}

// RateLimit returns a token bucket rate limiter middleware for chi.
// It tracks per-IP buckets using sync.Map.
func RateLimit(cfg RateLimitConfig) func(http.Handler) http.Handler {
	if cfg.AuthRate == 0 {
		cfg = DefaultRateLimitConfig()
	}

	var buckets sync.Map

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr

			rate := float64(cfg.AnonRate)
			if r.Header.Get("Authorization") != "" {
				rate = float64(cfg.AuthRate)
			}

			key := ip

			val, _ := buckets.LoadOrStore(key, &bucket{
				tokens:    rate,
				lastCheck: time.Now(),
				rate:      rate,
			})

			b := val.(*bucket)
			if !b.allow() {
				w.Header().Set("Retry-After", "60")
				response.Error(w, &apperrors.AppError{
					Code:       apperrors.ErrRateLimit,
					Message:    "rate limit exceeded",
					HTTPStatus: http.StatusTooManyRequests,
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
