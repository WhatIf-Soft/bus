package port

import (
	"context"

	"github.com/busexpress/services/search/internal/domain"
	"github.com/google/uuid"
)

// SearchService defines the behaviour exposed to HTTP adapters.
type SearchService interface {
	SearchTrips(ctx context.Context, c domain.SearchCriteria) (trips []domain.TripResult, total int, err error)
	Autocomplete(ctx context.Context, prefix string) ([]domain.Stop, error)
	GetTrip(ctx context.Context, id uuid.UUID) (*domain.TripResult, error)
}
