package port

import (
	"context"

	"github.com/busexpress/services/booking/internal/domain"
	"github.com/google/uuid"
)

// TripClient abstracts the search-service HTTP call so the booking service
// is testable without spinning up a real HTTP backend.
type TripClient interface {
	GetTrip(ctx context.Context, id uuid.UUID) (*domain.Trip, error)
}
