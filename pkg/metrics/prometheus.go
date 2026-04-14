package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
)

// HTTPRequestsTotal counts total HTTP requests by method, path, and status.
var HTTPRequestsTotal = prometheus.NewCounterVec(
	prometheus.CounterOpts{
		Namespace: "busexpress",
		Name:      "http_requests_total",
		Help:      "Total number of HTTP requests.",
	},
	[]string{"method", "path", "status"},
)

// HTTPRequestDuration observes request duration by method and path.
var HTTPRequestDuration = prometheus.NewHistogramVec(
	prometheus.HistogramOpts{
		Namespace: "busexpress",
		Name:      "http_request_duration_seconds",
		Help:      "HTTP request duration in seconds.",
		Buckets:   prometheus.DefBuckets,
	},
	[]string{"method", "path"},
)

// ActiveConnections tracks the number of active connections.
var ActiveConnections = prometheus.NewGauge(
	prometheus.GaugeOpts{
		Namespace: "busexpress",
		Name:      "active_connections",
		Help:      "Number of active connections.",
	},
)

// Register registers all Prometheus collectors.
func Register() {
	prometheus.MustRegister(
		HTTPRequestsTotal,
		HTTPRequestDuration,
		ActiveConnections,
	)
}
