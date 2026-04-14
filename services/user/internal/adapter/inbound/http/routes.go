package http

import (
	"github.com/go-chi/chi/v5"

	"github.com/busexpress/services/user/internal/port"
)

// RegisterRoutes mounts all user-service HTTP routes onto the given chi router.
// Routes under /me require authentication middleware applied by the caller.
func RegisterRoutes(r chi.Router, svc port.UserService) {
	h := NewHandler(svc)

	r.Route("/api/v1/users", func(r chi.Router) {
		// Public routes
		r.Post("/register", h.Register)
		r.Post("/login", h.Login)
		r.Post("/refresh", h.RefreshToken)

		// Authenticated routes — auth middleware should be applied by the caller
		// on the parent router or via a group.
		r.Route("/me", func(r chi.Router) {
			r.Get("/", h.GetProfile)
			r.Put("/", h.UpdateProfile)
			r.Delete("/", h.DeleteAccount)

			r.Post("/2fa/enable", h.Enable2FA)
			r.Post("/2fa/verify", h.Verify2FA)

			r.Get("/sessions", h.ListSessions)
			r.Delete("/sessions/{id}", h.RevokeSession)
		})
	})
}
