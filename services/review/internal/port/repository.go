package port

import (
	"context"

	"github.com/busexpress/services/review/internal/domain"
	"github.com/google/uuid"
)

// ReviewRepository persists reviews.
type ReviewRepository interface {
	Create(ctx context.Context, r *domain.Review) error
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Review, error)
	ListByOperator(ctx context.Context, opID uuid.UUID, limit, offset int) ([]domain.Review, int, error)
	ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Review, int, error)
	GetByBookingAndUser(ctx context.Context, bookingID, userID uuid.UUID) (*domain.Review, error)
	Aggregate(ctx context.Context, opID uuid.UUID) (*domain.Aggregate, error)
	SetReply(ctx context.Context, id uuid.UUID, reply string) error
}
