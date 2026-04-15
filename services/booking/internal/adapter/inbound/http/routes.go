package http

import (
	"github.com/go-chi/chi/v5"

	"github.com/busexpress/pkg/auth"
	"github.com/busexpress/pkg/idempotency"
	"github.com/busexpress/services/booking/internal/port"
)

// RegisterRoutes mounts booking-service HTTP routes onto the chi router.
func RegisterRoutes(r chi.Router, svc port.BookingService, jwtSecret []byte, idemStore *idempotency.Store) {
	h := NewHandler(svc)

	r.Route("/api/v1/bookings", func(r chi.Router) {
		r.Use(auth.JWTMiddleware(jwtSecret))

		r.With(idempotency.Middleware(idemStore)).Post("/", h.Create)
		r.Get("/", h.List)
		r.Get("/{id}", h.Get)
		r.Post("/{id}/confirm", h.Confirm)
		r.Post("/{id}/cancel", h.Cancel)
	})
}
