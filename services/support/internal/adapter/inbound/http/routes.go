package http

import (
	"github.com/go-chi/chi/v5"

	"github.com/busexpress/pkg/auth"
	"github.com/busexpress/services/support/internal/port"
)

// RegisterRoutes mounts support-service routes onto the chi router.
func RegisterRoutes(r chi.Router, svc port.SupportService, jwtSecret []byte) {
	h := NewHandler(svc)
	chatbot := NewChatbotHandler()

	// Chatbot is public — no auth needed for FAQ queries.
	r.Post("/api/v1/support/chat", chatbot.Chat)

	r.Route("/api/v1/support/tickets", func(r chi.Router) {
		r.Use(auth.JWTMiddleware(jwtSecret))

		r.Post("/", h.Create)
		r.Get("/mine", h.ListMine)
		r.Get("/{id}", h.Get)
		r.Post("/{id}/messages", h.PostMessage)
		r.Put("/{id}/status", h.PutStatus)

		// Agent / admin only.
		r.Group(func(r chi.Router) {
			r.Use(auth.RequireRole("agent_support", "admin"))
			r.Get("/", h.ListOpen)
			r.Post("/{id}/assign", h.Assign)
		})
	})
}
