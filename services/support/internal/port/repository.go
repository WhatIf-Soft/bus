package port

import (
	"context"
	"time"

	"github.com/busexpress/services/support/internal/domain"
	"github.com/google/uuid"
)

// TicketRepository persists support tickets and their messages.
type TicketRepository interface {
	CreateTicket(ctx context.Context, t *domain.Ticket, initial domain.Message) error
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Ticket, error)
	ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Ticket, int, error)
	ListOpen(ctx context.Context, limit, offset int) ([]domain.Ticket, int, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status domain.Status, when time.Time) error
	AssignAgent(ctx context.Context, id, agentID uuid.UUID) error
	AddMessage(ctx context.Context, m *domain.Message) error
}
