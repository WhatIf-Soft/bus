package port

import (
	"context"

	"github.com/busexpress/services/operator/internal/domain"
	"github.com/google/uuid"
)

// ProfileRepository persists operator company profiles.
type ProfileRepository interface {
	Create(ctx context.Context, p *domain.Profile) error
	GetByUser(ctx context.Context, userID uuid.UUID) (*domain.Profile, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Profile, error)
	Update(ctx context.Context, p *domain.Profile) error
}

// BusRepository persists fleet records.
type BusRepository interface {
	Create(ctx context.Context, b *domain.Bus) error
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Bus, error)
	ListByOperator(ctx context.Context, opID uuid.UUID, limit, offset int) ([]domain.Bus, int, error)
	Update(ctx context.Context, b *domain.Bus) error
	Delete(ctx context.Context, id uuid.UUID) error
}

// DriverRepository persists driver records.
type DriverRepository interface {
	Create(ctx context.Context, d *domain.Driver) error
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Driver, error)
	ListByOperator(ctx context.Context, opID uuid.UUID, limit, offset int) ([]domain.Driver, int, error)
	Update(ctx context.Context, d *domain.Driver) error
	Delete(ctx context.Context, id uuid.UUID) error
}

// PolicyRepository persists cancellation and baggage policies.
type PolicyRepository interface {
	GetCancellation(ctx context.Context, opID uuid.UUID) (*domain.CancellationPolicy, error)
	UpsertCancellation(ctx context.Context, p *domain.CancellationPolicy) error
	GetBaggage(ctx context.Context, opID uuid.UUID) (*domain.BaggagePolicy, error)
	UpsertBaggage(ctx context.Context, p *domain.BaggagePolicy) error
}
