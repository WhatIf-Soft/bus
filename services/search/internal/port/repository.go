package port

import (
	"context"

	"github.com/busexpress/services/search/internal/domain"
	"github.com/google/uuid"
)

// SearchRepository defines data access for search operations.
type SearchRepository interface {
	// SearchTrips finds trips matching the provided criteria.
	SearchTrips(ctx context.Context, c domain.SearchCriteria) ([]domain.TripResult, int, error)

	// AutocompleteStops returns up to `limit` stops whose city/name matches the prefix.
	AutocompleteStops(ctx context.Context, prefix string, limit int) ([]domain.Stop, error)

	// GetTripByID loads a full trip result by ID (for booking handoff).
	GetTripByID(ctx context.Context, id uuid.UUID) (*domain.TripResult, error)
}
