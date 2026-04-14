package http

import (
	"github.com/go-chi/chi/v5"

	"github.com/busexpress/pkg/auth"
	"github.com/busexpress/services/user/internal/port"
)

// RegisterRoutes mounts all user-service HTTP routes onto the given chi router.
// JWTMiddleware is applied to /me routes using the provided jwtSecret.
func RegisterRoutes(r chi.Router, svc port.UserService, jwtSecret []byte) {
	h := NewHandler(svc)

	r.Route("/api/v1/users", func(r chi.Router) {
		// Public routes
		r.Post("/register", h.Register)
		r.Post("/login", h.Login)
		r.Post("/login/2fa", h.Login2FA)
		r.Post("/refresh", h.RefreshToken)

		// Authenticated routes — JWT required.
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

				// Saved passengers (SF-USR-06)
				r.Get("/passengers", h.ListSavedPassengers)
				r.Post("/passengers", h.CreateSavedPassenger)
				r.Put("/passengers/{id}", h.UpdateSavedPassenger)
				r.Delete("/passengers/{id}", h.DeleteSavedPassenger)
			})
		})
	})
}
