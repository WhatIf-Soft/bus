package http

import (
	"time"

	"github.com/busexpress/services/support/internal/domain"
)

// CreateTicketRequest is the body for POST /api/v1/support/tickets.
type CreateTicketRequest struct {
	Subject   string  `json:"subject"            validate:"required,min=3,max=200"`
	Body      string  `json:"body"               validate:"required,min=3,max=4000"`
	Category  string  `json:"category,omitempty" validate:"omitempty,oneof=booking payment refund account baggage incident other"`
	Priority  string  `json:"priority,omitempty" validate:"omitempty,oneof=low normal high urgent"`
	BookingID *string `json:"booking_id,omitempty" validate:"omitempty,uuid"`
}

// PostMessageRequest is the body for POST /api/v1/support/tickets/{id}/messages.
type PostMessageRequest struct {
	Body string `json:"body" validate:"required,min=1,max=4000"`
}

// UpdateStatusRequest is the body for PUT /api/v1/support/tickets/{id}/status.
type UpdateStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=open in_progress awaiting_customer resolved closed"`
}

// MessageResponse is one entry in the thread.
type MessageResponse struct {
	ID         string    `json:"id"`
	AuthorRole string    `json:"author_role"`
	AuthorID   string    `json:"author_id"`
	Body       string    `json:"body"`
	CreatedAt  time.Time `json:"created_at"`
}

// TicketResponse is the public representation of a ticket.
type TicketResponse struct {
	ID              string            `json:"id"`
	UserID          string            `json:"user_id"`
	Subject         string            `json:"subject"`
	Category        string            `json:"category"`
	Priority        string            `json:"priority"`
	Status          string            `json:"status"`
	BookingID       *string           `json:"booking_id,omitempty"`
	AssignedAgentID *string           `json:"assigned_agent_id,omitempty"`
	CreatedAt       time.Time         `json:"created_at"`
	UpdatedAt       time.Time         `json:"updated_at"`
	ClosedAt        *time.Time        `json:"closed_at,omitempty"`
	Messages        []MessageResponse `json:"messages"`
}

// ListTicketsResponse is a paginated list.
type ListTicketsResponse struct {
	Tickets []TicketResponse `json:"tickets"`
	Total   int              `json:"total"`
	Limit   int              `json:"limit"`
	Offset  int              `json:"offset"`
}

func toTicketResponse(t *domain.Ticket) TicketResponse {
	var booking, agent *string
	if t.BookingID != nil {
		s := t.BookingID.String()
		booking = &s
	}
	if t.AssignedAgentID != nil {
		s := t.AssignedAgentID.String()
		agent = &s
	}
	msgs := make([]MessageResponse, 0, len(t.Messages))
	for _, m := range t.Messages {
		msgs = append(msgs, MessageResponse{
			ID: m.ID.String(), AuthorRole: string(m.AuthorRole),
			AuthorID: m.AuthorID.String(), Body: m.Body, CreatedAt: m.CreatedAt,
		})
	}
	return TicketResponse{
		ID:              t.ID.String(),
		UserID:          t.UserID.String(),
		Subject:         t.Subject,
		Category:        string(t.Category),
		Priority:        string(t.Priority),
		Status:          string(t.Status),
		BookingID:       booking,
		AssignedAgentID: agent,
		CreatedAt:       t.CreatedAt,
		UpdatedAt:       t.UpdatedAt,
		ClosedAt:        t.ClosedAt,
		Messages:        msgs,
	}
}
