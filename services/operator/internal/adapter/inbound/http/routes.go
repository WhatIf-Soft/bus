package http

import (
	"github.com/go-chi/chi/v5"

	"github.com/busexpress/pkg/auth"
	"github.com/busexpress/services/operator/internal/port"
)

// RegisterRoutes mounts operator routes onto the chi router.
// All routes require an authenticated user with role `operateur` or `admin`.
func RegisterRoutes(r chi.Router, svc port.OperatorService, jwtSecret []byte) {
	h := NewHandler(svc)

	r.Route("/api/v1/operator", func(r chi.Router) {
		r.Use(auth.JWTMiddleware(jwtSecret))
		r.Use(auth.RequireRole("operateur", "admin"))

		r.Get("/profile", h.GetProfile)
		r.Put("/profile", h.UpdateProfile)

		r.Get("/buses", h.ListBuses)
		r.Post("/buses", h.CreateBus)
		r.Put("/buses/{id}", h.UpdateBus)
		r.Delete("/buses/{id}", h.DeleteBus)

		r.Get("/drivers", h.ListDrivers)
		r.Post("/drivers", h.CreateDriver)
		r.Put("/drivers/{id}", h.UpdateDriver)
		r.Delete("/drivers/{id}", h.DeleteDriver)

		r.Get("/policies/cancellation", h.GetCancellationPolicy)
		r.Put("/policies/cancellation", h.PutCancellationPolicy)
		r.Get("/policies/baggage", h.GetBaggagePolicy)
		r.Put("/policies/baggage", h.PutBaggagePolicy)
	})
}
