package port

import (
	"context"
	"time"

	"github.com/busexpress/services/payment/internal/domain"
	"github.com/google/uuid"
)

// PaymentRepository defines persistence for payment records.
type PaymentRepository interface {
	Create(ctx context.Context, p *domain.Payment) error
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Payment, error)
	ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Payment, int, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status domain.Status, externalRef *string, failureReason *string, completedAt *time.Time) error
}
