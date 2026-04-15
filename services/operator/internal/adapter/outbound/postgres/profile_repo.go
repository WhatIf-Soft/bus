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

type profileRepo struct {
	pool *pgxpool.Pool
}

// NewProfileRepository constructs a Postgres-backed profile repo.
func NewProfileRepository(pool *pgxpool.Pool) port.ProfileRepository {
	return &profileRepo{pool: pool}
}

func (r *profileRepo) Create(ctx context.Context, p *domain.Profile) error {
	const q = `
        INSERT INTO operator_profiles
            (id, user_id, name, contact_email, contact_phone, address, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err := r.pool.Exec(ctx, q,
		p.ID, p.UserID, p.Name, p.ContactEmail, p.ContactPhone, p.Address,
		p.CreatedAt, p.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.ErrProfileExists
		}
		return fmt.Errorf("insert profile: %w", err)
	}
	return nil
}

func (r *profileRepo) GetByUser(ctx context.Context, userID uuid.UUID) (*domain.Profile, error) {
	const q = `
        SELECT id, user_id, name, contact_email, contact_phone, address, created_at, updated_at
        FROM operator_profiles WHERE user_id = $1`
	p := &domain.Profile{}
	err := r.pool.QueryRow(ctx, q, userID).Scan(
		&p.ID, &p.UserID, &p.Name, &p.ContactEmail, &p.ContactPhone, &p.Address,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrProfileNotFound
		}
		return nil, err
	}
	return p, nil
}

func (r *profileRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Profile, error) {
	const q = `
        SELECT id, user_id, name, contact_email, contact_phone, address, created_at, updated_at
        FROM operator_profiles WHERE id = $1`
	p := &domain.Profile{}
	err := r.pool.QueryRow(ctx, q, id).Scan(
		&p.ID, &p.UserID, &p.Name, &p.ContactEmail, &p.ContactPhone, &p.Address,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrProfileNotFound
		}
		return nil, err
	}
	return p, nil
}

func (r *profileRepo) Update(ctx context.Context, p *domain.Profile) error {
	const q = `
        UPDATE operator_profiles
        SET name = $1, contact_email = $2, contact_phone = $3, address = $4, updated_at = NOW()
        WHERE id = $5`
	tag, err := r.pool.Exec(ctx, q, p.Name, p.ContactEmail, p.ContactPhone, p.Address, p.ID)
	if err != nil {
		return fmt.Errorf("update profile: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrProfileNotFound
	}
	return nil
}
