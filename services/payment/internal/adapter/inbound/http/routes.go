package http

import (
	"github.com/go-chi/chi/v5"

	"github.com/busexpress/pkg/auth"
	"github.com/busexpress/pkg/idempotency"
	"github.com/busexpress/services/payment/internal/port"
)

// RegisterRoutes mounts payment routes onto the chi router.
func RegisterRoutes(r chi.Router, svc port.PaymentService, jwtSecret []byte, idemStore *idempotency.Store) {
	h := NewHandler(svc)

	// Webhook is unauthenticated (provider callback). Mounted before auth group.
	r.Post("/api/v1/payments/{id}/webhook", h.Webhook)

	r.Route("/api/v1/payments", func(r chi.Router) {
		r.Use(auth.JWTMiddleware(jwtSecret))

		r.With(idempotency.Middleware(idemStore)).Post("/", h.Initiate)
		r.Get("/", h.List)
		r.Get("/{id}", h.Get)
		r.Post("/{id}/cancel", h.Cancel)
	})
}
