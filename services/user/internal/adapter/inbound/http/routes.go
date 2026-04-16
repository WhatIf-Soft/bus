package http

import (
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/busexpress/pkg/auth"
	"github.com/busexpress/services/user/internal/port"
)

// RegisterRoutesWithNotif mounts user-service routes.
// notifURL is the notification-service base URL for sending reset/verify emails.
func RegisterRoutesWithNotif(r chi.Router, svc port.UserService, jwtSecret []byte, pool *pgxpool.Pool, notifURL string) {
	h := NewHandler(svc)
	admin := NewAdminHandler(pool)
	loyalty := NewLoyaltyHandler(pool)
	referral := NewReferralHandler(pool)
	pwReset := NewPasswordResetHandler(pool, notifURL)

	r.Route("/api/v1/users", func(r chi.Router) {
		r.Post("/register", h.Register)
		r.Post("/login", h.Login)
		r.Post("/login/2fa", h.Login2FA)
		r.Post("/refresh", h.RefreshToken)

		// Public password reset flow.
		r.Post("/password/reset-request", pwReset.RequestReset)
		r.Post("/password/reset-confirm", pwReset.ConfirmReset)

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

				r.Get("/loyalty", loyalty.GetBalance)
				r.Get("/loyalty/history", loyalty.GetHistory)

				r.Get("/referral", referral.GetCode)
				r.Post("/referral/apply", referral.ApplyCode)

				r.Post("/verify-email", pwReset.RequestVerification)
				r.Post("/verify-email/confirm", pwReset.ConfirmVerification)
			})
		})
	})

	r.Route("/api/v1/admin/users", func(r chi.Router) {
		r.Use(auth.JWTMiddleware(jwtSecret))
		r.Use(auth.RequireRole("admin"))

		r.Get("/", admin.ListUsers)
		r.Patch("/{id}", admin.PatchUser)
		r.Post("/{id}/loyalty/credit", loyalty.Credit)
	})
}

// RegisterRoutes is the backwards-compatible entry (notifURL defaults to localhost:4006).
func RegisterRoutes(r chi.Router, svc port.UserService, jwtSecret []byte, pool *pgxpool.Pool) {
	RegisterRoutesWithNotif(r, svc, jwtSecret, pool, "http://localhost:4006")
}
