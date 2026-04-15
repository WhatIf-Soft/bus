package http

import (
	"github.com/go-chi/chi/v5"

	"github.com/busexpress/pkg/auth"
	"github.com/busexpress/services/review/internal/port"
)

// RegisterRoutes mounts review-service routes onto r.
//
// Public:
//   GET  /api/v1/reviews              ?operator_id=...  list published reviews for an operator
//   GET  /api/v1/reviews/aggregate    ?operator_id=...  rating histogram + average
//
// Authenticated:
//   POST /api/v1/reviews                                voyageur posts a review for a confirmed/used booking
//   GET  /api/v1/reviews/mine                           list the caller's own reviews
//
// Operator:
//   POST /api/v1/reviews/{id}/reply   ?operator_id=...  operator replies to a review
func RegisterRoutes(r chi.Router, svc port.ReviewService, jwtSecret []byte) {
	h := NewHandler(svc)

	r.Route("/api/v1/reviews", func(r chi.Router) {
		// Public reads.
		r.Get("/", h.ListByOperator)
		r.Get("/aggregate", h.Aggregate)

		// Authenticated.
		r.Group(func(r chi.Router) {
			r.Use(auth.JWTMiddleware(jwtSecret))
			r.Post("/", h.Create)
			r.Get("/mine", h.ListMine)

			r.With(auth.RequireRole("operateur", "admin")).
				Post("/{id}/reply", h.Reply)
		})
	})
}
