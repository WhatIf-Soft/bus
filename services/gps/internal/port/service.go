package port

import (
	"context"

	"github.com/busexpress/services/gps/internal/domain"
	"github.com/google/uuid"
)

// GPSService is the application API for GPS tracking.
type GPSService interface {
	StartTracking(ctx context.Context, tripID uuid.UUID, busID, driverID *uuid.UUID) (*domain.TripTracking, error)
	UpdatePosition(ctx context.Context, upd domain.PositionUpdate) error
	GetPosition(ctx context.Context, tripID uuid.UUID) (*domain.TripTracking, error)
	Complete(ctx context.Context, tripID uuid.UUID) error
}
