package port

import (
	"context"

	"github.com/busexpress/services/gps/internal/domain"
	"github.com/google/uuid"
)

// TrackingRepository persists trip-tracking metadata in Postgres.
// The time-series position data lives in InfluxDB (Phase-2 wiring).
type TrackingRepository interface {
	Upsert(ctx context.Context, t *domain.TripTracking) error
	GetByTrip(ctx context.Context, tripID uuid.UUID) (*domain.TripTracking, error)
	UpdatePosition(ctx context.Context, upd domain.PositionUpdate) error
	Complete(ctx context.Context, tripID uuid.UUID) error
}
