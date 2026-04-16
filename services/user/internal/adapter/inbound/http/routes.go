package http

import (
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/busexpress/pkg/auth"
	"github.com/busexpress/services/user/internal/port"
)

// RegisterRoutes mounts all user-service HTTP routes onto the given chi router.
func RegisterRoutes(r chi.Router, svc port.UserService, jwtSecret []byte, pool *pgxpool.Pool) {
	h := NewHandler(svc)
	admin := NewAdminHandler(pool)
	loyalty := NewLoyaltyHandler(pool)

	r.Route("/api/v1/users", func(r chi.Router) {
		r.Post("/register", h.Register)
		r.Post("/login", h.Login)
		r.Post("/login/2fa", h.Login2FA)
		r.Post("/refresh", h.RefreshToken)

		r.Group(func(r chi.Router) {
			r.Use(auth.JWTMiddleware(jwtSecret))

			r.Route("/me", func(r chi.Router) {
				r.Get("/", h.GetProfile)
				r.Put("/", h.UpdateProfile)
				r.Delete("/", h.DeleteAccount)

				r.Post("/2fa/enable", h.Enable2FA)
				r.Post("/2fa/verify", h.Verify2FA)

				r.Get("/sessions", h.ListSessions)
				r.Delete("/sessions/{id}", h.RevokeSession)

				r.Get("/passengers", h.ListSavedPassengers)
				r.Post("/passengers", h.CreateSavedPassenger)
				r.Put("/passengers/{id}", h.UpdateSavedPassenger)
				r.Delete("/passengers/{id}", h.DeleteSavedPassenger)

				// Loyalty (CLAUDE.md §10 Phase 2 — fidélité)
				r.Get("/loyalty", loyalty.GetBalance)
				r.Get("/loyalty/history", loyalty.GetHistory)
			})
		})
	})

	// Admin back-office
	r.Route("/api/v1/admin/users", func(r chi.Router) {
		r.Use(auth.JWTMiddleware(jwtSecret))
		r.Use(auth.RequireRole("admin"))

		r.Get("/", admin.ListUsers)
		r.Patch("/{id}", admin.PatchUser)
		r.Post("/{id}/loyalty/credit", loyalty.Credit)
	})
}
