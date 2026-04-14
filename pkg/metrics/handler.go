package metrics

import (
	"net/http"

	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// NewHandler returns an HTTP handler that exposes Prometheus metrics.
func NewHandler() http.Handler {
	return promhttp.Handler()
}
