package port

import (
	"context"
	"time"

	"github.com/busexpress/services/ticket/internal/domain"
	"github.com/google/uuid"
)

// TicketRepository defines persistence for tickets.
type TicketRepository interface {
	CreateBatch(ctx context.Context, tickets []domain.Ticket) error
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Ticket, error)
	ListByBooking(ctx context.Context, bookingID uuid.UUID) ([]domain.Ticket, error)
	ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Ticket, int, error)
	MarkUsed(ctx context.Context, id uuid.UUID, when time.Time) error
}
