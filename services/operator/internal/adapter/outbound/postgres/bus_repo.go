package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/busexpress/services/operator/internal/domain"
	"github.com/busexpress/services/operator/internal/port"
)

type busRepo struct {
	pool *pgxpool.Pool
}

// NewBusRepository constructs a Postgres-backed bus repository.
func NewBusRepository(pool *pgxpool.Pool) port.BusRepository {
	return &busRepo{pool: pool}
}

func (r *busRepo) Create(ctx context.Context, b *domain.Bus) error {
	amenities, _ := json.Marshal(b.Amenities)
	const q = `
        INSERT INTO buses
            (id, operator_id, license_plate, model, capacity, class, amenities, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6::bus_class, $7, $8::bus_status, $9, $10)`
	_, err := r.pool.Exec(ctx, q,
		b.ID, b.OperatorID, b.LicensePlate, b.Model, b.Capacity,
		string(b.Class), amenities, string(b.Status), b.CreatedAt, b.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.ErrLicensePlateConflict
		}
		return fmt.Errorf("insert bus: %w", err)
	}
	return nil
}

func (r *busRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Bus, error) {
	const q = `
        SELECT id, operator_id, license_plate, model, capacity, class, amenities, status, created_at, updated_at
        FROM buses WHERE id = $1`
	var amenities []byte
	b := &domain.Bus{}
	err := r.pool.QueryRow(ctx, q, id).Scan(
		&b.ID, &b.OperatorID, &b.LicensePlate, &b.Model, &b.Capacity,
		&b.Class, &amenities, &b.Status, &b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrBusNotFound
		}
		return nil, err
	}
	if len(amenities) > 0 {
		_ = json.Unmarshal(amenities, &b.Amenities)
	}
	return b, nil
}

func (r *busRepo) ListByOperator(ctx context.Context, opID uuid.UUID, limit, offset int) ([]domain.Bus, int, error) {
	if limit <= 0 {
		limit = 50
	}
	var total int
	if err := r.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM buses WHERE operator_id = $1", opID).Scan(&total); err != nil {
		return nil, 0, err
	}
	const q = `
        SELECT id, operator_id, license_plate, model, capacity, class, amenities, status, created_at, updated_at
        FROM buses WHERE operator_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`
	rows, err := r.pool.Query(ctx, q, opID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	out := make([]domain.Bus, 0, limit)
	for rows.Next() {
		var b domain.Bus
		var amenities []byte
		if err := rows.Scan(
			&b.ID, &b.OperatorID, &b.LicensePlate, &b.Model, &b.Capacity,
			&b.Class, &amenities, &b.Status, &b.CreatedAt, &b.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		if len(amenities) > 0 {
			_ = json.Unmarshal(amenities, &b.Amenities)
		}
		out = append(out, b)
	}
	return out, total, rows.Err()
}

func (r *busRepo) Update(ctx context.Context, b *domain.Bus) error {
	amenities, _ := json.Marshal(b.Amenities)
	const q = `
        UPDATE buses
        SET model = $1, capacity = $2, class = $3::bus_class,
            amenities = $4, status = $5::bus_status, updated_at = NOW()
        WHERE id = $6`
	tag, err := r.pool.Exec(ctx, q,
		b.Model, b.Capacity, string(b.Class), amenities, string(b.Status), b.ID,
	)
	if err != nil {
		return fmt.Errorf("update bus: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrBusNotFound
	}
	return nil
}

func (r *busRepo) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, "DELETE FROM buses WHERE id = $1", id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrBusNotFound
	}
	return nil
}
