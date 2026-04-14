package metrics

import (
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5/middleware"
)

// HTTPMetrics returns a chi middleware that records request duration
// and status code in Prometheus histograms and counters.
func HTTPMetrics(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

		ActiveConnections.Inc()
		defer ActiveConnections.Dec()

		next.ServeHTTP(ww, r)

		duration := time.Since(start).Seconds()
		status := strconv.Itoa(ww.Status())

		HTTPRequestsTotal.WithLabelValues(r.Method, r.URL.Path, status).Inc()
		HTTPRequestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
	})
}
