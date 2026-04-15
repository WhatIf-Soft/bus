package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/busexpress/services/operator/internal/domain"
	"github.com/busexpress/services/operator/internal/port"
)

type driverRepo struct {
	pool *pgxpool.Pool
}

// NewDriverRepository constructs a Postgres-backed driver repository.
func NewDriverRepository(pool *pgxpool.Pool) port.DriverRepository {
	return &driverRepo{pool: pool}
}

func (r *driverRepo) Create(ctx context.Context, d *domain.Driver) error {
	const q = `
        INSERT INTO drivers
            (id, operator_id, first_name, last_name, license_number, phone,
             license_expires_at, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::driver_status, $9, $10)`
	_, err := r.pool.Exec(ctx, q,
		d.ID, d.OperatorID, d.FirstName, d.LastName, d.LicenseNumber, d.Phone,
		d.LicenseExpiresAt, string(d.Status), d.CreatedAt, d.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.ErrLicenseNumberConflict
		}
		return fmt.Errorf("insert driver: %w", err)
	}
	return nil
}

func (r *driverRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Driver, error) {
	const q = `
        SELECT id, operator_id, first_name, last_name, license_number, phone,
               license_expires_at, status, created_at, updated_at
        FROM drivers WHERE id = $1`
	d := &domain.Driver{}
	err := r.pool.QueryRow(ctx, q, id).Scan(
		&d.ID, &d.OperatorID, &d.FirstName, &d.LastName, &d.LicenseNumber, &d.Phone,
		&d.LicenseExpiresAt, &d.Status, &d.CreatedAt, &d.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrDriverNotFound
		}
		return nil, err
	}
	return d, nil
}

func (r *driverRepo) ListByOperator(ctx context.Context, opID uuid.UUID, limit, offset int) ([]domain.Driver, int, error) {
	if limit <= 0 {
		limit = 50
	}
	var total int
	if err := r.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM drivers WHERE operator_id = $1", opID).Scan(&total); err != nil {
		return nil, 0, err
	}
	const q = `
        SELECT id, operator_id, first_name, last_name, license_number, phone,
               license_expires_at, status, created_at, updated_at
        FROM drivers WHERE operator_id = $1
        ORDER BY last_name, first_name
        LIMIT $2 OFFSET $3`
	rows, err := r.pool.Query(ctx, q, opID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	out := make([]domain.Driver, 0, limit)
	for rows.Next() {
		var d domain.Driver
		if err := rows.Scan(
			&d.ID, &d.OperatorID, &d.FirstName, &d.LastName, &d.LicenseNumber, &d.Phone,
			&d.LicenseExpiresAt, &d.Status, &d.CreatedAt, &d.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		out = append(out, d)
	}
	return out, total, rows.Err()
}

func (r *driverRepo) Update(ctx context.Context, d *domain.Driver) error {
	const q = `
        UPDATE drivers
        SET first_name = $1, last_name = $2, license_number = $3, phone = $4,
            license_expires_at = $5, status = $6::driver_status, updated_at = NOW()
        WHERE id = $7`
	tag, err := r.pool.Exec(ctx, q,
		d.FirstName, d.LastName, d.LicenseNumber, d.Phone,
		d.LicenseExpiresAt, string(d.Status), d.ID,
	)
	if err != nil {
		return fmt.Errorf("update driver: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrDriverNotFound
	}
	return nil
}

func (r *driverRepo) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, "DELETE FROM drivers WHERE id = $1", id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrDriverNotFound
	}
	return nil
}
