package http

import (
	"github.com/go-chi/chi/v5"

	"github.com/busexpress/pkg/auth"
	"github.com/busexpress/services/ticket/internal/port"
)

// RegisterRoutes mounts ticket routes onto the router.
func RegisterRoutes(r chi.Router, svc port.TicketService, jwtSecret []byte) {
	h := NewHandler(svc)

	// Validate is intentionally unauthenticated for dev: a controller scanning the QR
	// at the depot may not have a JWT yet (controller PWA in Phase 2). Production must
	// gate this with an `agent_support`/`controller` role.
	r.Post("/api/v1/tickets/validate", h.Validate)

	r.Route("/api/v1/tickets", func(r chi.Router) {
		r.Use(auth.JWTMiddleware(jwtSecret))

		r.Post("/", h.Issue)
		r.Get("/", h.ListByBooking)
		r.Get("/{id}", h.Get)
		r.Get("/{id}/pdf", h.PDF)
	})
}
