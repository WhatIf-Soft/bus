package port

import (
	"context"
	"time"

	"github.com/busexpress/services/booking/internal/domain"
	"github.com/google/uuid"
)

// BookingRepository defines persistence operations for bookings.
type BookingRepository interface {
	Create(ctx context.Context, b *domain.Booking) error
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Booking, error)
	ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Booking, int, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, from, to domain.Status, when time.Time) error
	ExpirePendingSeats(ctx context.Context, before time.Time) (int, error)
}
