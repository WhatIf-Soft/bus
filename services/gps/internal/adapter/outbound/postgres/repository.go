package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/busexpress/services/gps/internal/domain"
	"github.com/busexpress/services/gps/internal/port"
)

type repo struct{ pool *pgxpool.Pool }

// NewPostgresTrackingRepository constructs a Postgres-backed tracking repo.
func NewPostgresTrackingRepository(pool *pgxpool.Pool) port.TrackingRepository {
	return &repo{pool: pool}
}

func (r *repo) Upsert(ctx context.Context, t *domain.TripTracking) error {
	const q = `
        INSERT INTO trip_tracking
            (id, trip_id, bus_id, driver_id, status, started_at)
        VALUES ($1, $2, $3, $4, $5::tracking_status, $6)
        ON CONFLICT (trip_id) DO UPDATE SET
            bus_id = EXCLUDED.bus_id,
            driver_id = EXCLUDED.driver_id,
            status = 'active',
            started_at = EXCLUDED.started_at`
	_, err := r.pool.Exec(ctx, q,
		t.ID, t.TripID, t.BusID, t.DriverID, string(t.Status), t.StartedAt,
	)
	if err != nil {
		return fmt.Errorf("upsert tracking: %w", err)
	}
	return nil
}

func (r *repo) GetByTrip(ctx context.Context, tripID uuid.UUID) (*domain.TripTracking, error) {
	const q = `
        SELECT id, trip_id, bus_id, driver_id, status,
               last_lat, last_lng, last_speed_kmh, last_updated_at,
               started_at, completed_at
        FROM trip_tracking WHERE trip_id = $1`
	t := &domain.TripTracking{}
	err := r.pool.QueryRow(ctx, q, tripID).Scan(
		&t.ID, &t.TripID, &t.BusID, &t.DriverID, &t.Status,
		&t.LastLat, &t.LastLng, &t.LastSpeedKmh, &t.LastUpdatedAt,
		&t.StartedAt, &t.CompletedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrTrackingNotFound
		}
		return nil, err
	}
	return t, nil
}

func (r *repo) UpdatePosition(ctx context.Context, upd domain.PositionUpdate) error {
	const q = `
        UPDATE trip_tracking
        SET last_lat = $1, last_lng = $2, last_speed_kmh = $3,
            last_updated_at = $4, status = 'active'
        WHERE trip_id = $5 AND status = 'active'`
	tag, err := r.pool.Exec(ctx, q,
		upd.Lat, upd.Lng, upd.SpeedKmh, upd.Time, upd.TripID,
	)
	if err != nil {
		return fmt.Errorf("update position: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotActive
	}
	return nil
}

func (r *repo) Complete(ctx context.Context, tripID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `
        UPDATE trip_tracking
        SET status = 'completed', completed_at = NOW()
        WHERE trip_id = $1 AND status = 'active'`, tripID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrTrackingNotFound
	}
	return nil
}
