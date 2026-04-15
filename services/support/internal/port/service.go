package port

import (
	"context"

	"github.com/busexpress/services/support/internal/domain"
	"github.com/google/uuid"
)

// CreateTicketRequest is the input for opening a new ticket.
type CreateTicketRequest struct {
	UserID    uuid.UUID
	Subject   string
	Category  domain.Category
	Priority  domain.Priority
	BookingID *uuid.UUID
	Body      string
}

// SupportService is the application API.
type SupportService interface {
	Create(ctx context.Context, req CreateTicketRequest) (*domain.Ticket, error)
	Get(ctx context.Context, requesterID uuid.UUID, isAgent bool, id uuid.UUID) (*domain.Ticket, error)
	ListMine(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Ticket, int, error)
	ListOpen(ctx context.Context, limit, offset int) ([]domain.Ticket, int, error)
	PostMessage(ctx context.Context, requesterID uuid.UUID, isAgent bool, ticketID uuid.UUID, body string) (*domain.Ticket, error)
	UpdateStatus(ctx context.Context, requesterID uuid.UUID, isAgent bool, ticketID uuid.UUID, status domain.Status) (*domain.Ticket, error)
	AssignAgent(ctx context.Context, ticketID, agentID uuid.UUID) (*domain.Ticket, error)
}
