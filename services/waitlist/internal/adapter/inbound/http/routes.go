package http

import (
	"github.com/go-chi/chi/v5"

	"github.com/busexpress/pkg/auth"
	"github.com/busexpress/services/waitlist/internal/port"
)

// RegisterRoutes mounts waitlist routes onto the chi router.
func RegisterRoutes(r chi.Router, svc port.WaitlistService, jwtSecret []byte) {
	h := NewHandler(svc)

	// Dev-only manual fan-out trigger; in production this is internal RPC.
	r.Post("/api/v1/waitlist/check", h.CheckAndNotify)

	r.Route("/api/v1/waitlist", func(r chi.Router) {
		r.Use(auth.JWTMiddleware(jwtSecret))

		r.Post("/", h.Join)
		r.Get("/mine", h.ListMine)
		r.Get("/{id}", h.Get)
		r.Post("/{id}/cancel", h.Cancel)
	})
}
