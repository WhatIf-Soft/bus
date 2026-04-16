package http

import (
	"github.com/go-chi/chi/v5"

	"github.com/busexpress/services/gps/internal/port"
)

// RegisterRoutes mounts GPS routes. In production, position-update and
// start/complete require operator/driver auth; for MVP all are open.
func RegisterRoutes(r chi.Router, svc port.GPSService) {
	h := NewHandler(svc)

	r.Route("/api/v1/gps", func(r chi.Router) {
		r.Post("/tracking", h.Start)
		r.Post("/position", h.UpdatePosition)
		r.Get("/trips/{tripId}/position", h.GetPosition)
		r.Post("/trips/{tripId}/complete", h.Complete)
	})
}
