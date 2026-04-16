package http

import (
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/busexpress/pkg/auth"
	"github.com/busexpress/services/search/internal/port"
)

// RegisterRoutes mounts all search-service HTTP routes onto the given chi router.
// pool is used by the alert handler for direct price_alerts CRUD.
func RegisterRoutes(r chi.Router, svc port.SearchService, jwtSecret []byte, pool *pgxpool.Pool) {
	h := NewHandler(svc)
	alerts := NewAlertHandler(pool)

	r.Route("/api/v1/search", func(r chi.Router) {
		r.Get("/trips", h.SearchTrips)
		r.Get("/trips/{id}", h.GetTrip)
		r.Get("/autocomplete", h.Autocomplete)

		// Price alerts — authenticated.
		r.Group(func(r chi.Router) {
			r.Use(auth.JWTMiddleware(jwtSecret))
			r.Post("/alerts", alerts.Create)
			r.Get("/alerts", alerts.List)
			r.Delete("/alerts/{id}", alerts.Delete)
		})
	})
}
