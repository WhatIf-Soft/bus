package health

import (
	"context"
	"net/http"

	"github.com/busexpress/pkg/response"
)

type healthStatus struct {
	Status string `json:"status"`
}

type readinessStatus struct {
	Status string            `json:"status"`
	Checks map[string]string `json:"checks,omitempty"`
}

// NewHandler returns a simple liveness handler that always reports OK.
func NewHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		response.JSON(w, http.StatusOK, healthStatus{Status: "ok"})
	}
}

// NewReadinessHandler returns a readiness handler that runs all provided
// health checks. It returns 200 if all pass, 503 if any fail.
func NewReadinessHandler(checks ...func(ctx context.Context) error) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		status := readinessStatus{
			Status: "ok",
			Checks: make(map[string]string),
		}

		allHealthy := true
		for i, check := range checks {
			name := checkName(i)
			if err := check(ctx); err != nil {
				status.Checks[name] = err.Error()
				allHealthy = false
			} else {
				status.Checks[name] = "ok"
			}
		}

		if !allHealthy {
			status.Status = "degraded"
			response.JSON(w, http.StatusServiceUnavailable, status)
			return
		}

		response.JSON(w, http.StatusOK, status)
	}
}

func checkName(index int) string {
	names := []string{
		"database", "redis", "kafka", "elasticsearch",
		"check_4", "check_5", "check_6", "check_7",
	}
	if index < len(names) {
		return names[index]
	}
	return "check"
}
