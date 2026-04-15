package port

import (
	"context"
	"time"

	"github.com/busexpress/services/waitlist/internal/domain"
	"github.com/google/uuid"
)

// WaitlistRepository persists waitlist entries.
type WaitlistRepository interface {
	Create(ctx context.Context, e *domain.Entry) error
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Entry, error)
	ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Entry, int, error)
	ListByTrip(ctx context.Context, tripID uuid.UUID) ([]domain.Entry, error)
	CountActiveByUser(ctx context.Context, userID uuid.UUID) (int, error)
	NextQueued(ctx context.Context, tripID uuid.UUID) (*domain.Entry, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status domain.Status) error
	MarkNotified(ctx context.Context, id uuid.UUID, deadline time.Time) error
	MarkFulfilled(ctx context.Context, id uuid.UUID, bookingID uuid.UUID) error
	MarkCancelled(ctx context.Context, id uuid.UUID, when time.Time) error
	ExpireNotified(ctx context.Context, before time.Time) (int, error)
}
