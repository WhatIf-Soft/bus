package http

import (
	"github.com/go-chi/chi/v5"

	"github.com/busexpress/services/search/internal/port"
)

// RegisterRoutes mounts all search-service HTTP routes onto the given chi router.
func RegisterRoutes(r chi.Router, svc port.SearchService) {
	h := NewHandler(svc)

	r.Route("/api/v1/search", func(r chi.Router) {
		r.Get("/trips", h.SearchTrips)
		r.Get("/trips/{id}", h.GetTrip)
		r.Get("/autocomplete", h.Autocomplete)
	})
}
