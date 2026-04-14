package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/busexpress/services/user/internal/domain"
	"github.com/busexpress/services/user/internal/port"
)

// ErrPassengerNotFound is returned when a saved passenger lookup fails.
var ErrPassengerNotFound = errors.New("saved passenger not found")

// postgresSavedPassengerRepo implements port.SavedPassengerRepository.
type postgresSavedPassengerRepo struct {
	pool *pgxpool.Pool
}

// NewPostgresSavedPassengerRepository creates a SavedPassengerRepository.
func NewPostgresSavedPassengerRepository(pool *pgxpool.Pool) port.SavedPassengerRepository {
	return &postgresSavedPassengerRepo{pool: pool}
}

func (r *postgresSavedPassengerRepo) Create(ctx context.Context, p domain.SavedPassenger) (domain.SavedPassenger, error) {
	query := `
		INSERT INTO saved_passengers (id, user_id, first_name, last_name, date_of_birth, document_number, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, user_id, first_name, last_name, date_of_birth, document_number, created_at`

	id := p.ID
	if id == uuid.Nil {
		id = uuid.New()
	}
	now := time.Now().UTC()

	var created domain.SavedPassenger
	err := r.pool.QueryRow(ctx, query,
		id, p.UserID, p.FirstName, p.LastName, p.DateOfBirth, p.DocumentNumber, now,
	).Scan(
		&created.ID, &created.UserID, &created.FirstName, &created.LastName,
		&created.DateOfBirth, &created.DocumentNumber, &created.CreatedAt,
	)
	if err != nil {
		return domain.SavedPassenger{}, fmt.Errorf("create saved passenger: %w", err)
	}

	return created, nil
}

func (r *postgresSavedPassengerRepo) FindByID(ctx context.Context, id uuid.UUID) (domain.SavedPassenger, error) {
	query := `
		SELECT id, user_id, first_name, last_name, date_of_birth, document_number, created_at
		FROM saved_passengers
		WHERE id = $1`

	var p domain.SavedPassenger
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.UserID, &p.FirstName, &p.LastName,
		&p.DateOfBirth, &p.DocumentNumber, &p.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.SavedPassenger{}, ErrPassengerNotFound
		}
		return domain.SavedPassenger{}, fmt.Errorf("find saved passenger: %w", err)
	}

	return p, nil
}

func (r *postgresSavedPassengerRepo) FindByUserID(ctx context.Context, userID uuid.UUID) ([]domain.SavedPassenger, error) {
	query := `
		SELECT id, user_id, first_name, last_name, date_of_birth, document_number, created_at
		FROM saved_passengers
		WHERE user_id = $1
		ORDER BY created_at ASC`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("list saved passengers: %w", err)
	}
	defer rows.Close()

	var passengers []domain.SavedPassenger
	for rows.Next() {
		var p domain.SavedPassenger
		if err := rows.Scan(
			&p.ID, &p.UserID, &p.FirstName, &p.LastName,
			&p.DateOfBirth, &p.DocumentNumber, &p.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan saved passenger: %w", err)
		}
		passengers = append(passengers, p)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows saved passengers: %w", err)
	}

	return passengers, nil
}

func (r *postgresSavedPassengerRepo) CountByUserID(ctx context.Context, userID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM saved_passengers WHERE user_id = $1`

	var count int
	if err := r.pool.QueryRow(ctx, query, userID).Scan(&count); err != nil {
		return 0, fmt.Errorf("count saved passengers: %w", err)
	}

	return count, nil
}

func (r *postgresSavedPassengerRepo) Update(ctx context.Context, p domain.SavedPassenger) (domain.SavedPassenger, error) {
	query := `
		UPDATE saved_passengers
		SET first_name = $2, last_name = $3, date_of_birth = $4, document_number = $5
		WHERE id = $1
		RETURNING id, user_id, first_name, last_name, date_of_birth, document_number, created_at`

	var updated domain.SavedPassenger
	err := r.pool.QueryRow(ctx, query,
		p.ID, p.FirstName, p.LastName, p.DateOfBirth, p.DocumentNumber,
	).Scan(
		&updated.ID, &updated.UserID, &updated.FirstName, &updated.LastName,
		&updated.DateOfBirth, &updated.DocumentNumber, &updated.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.SavedPassenger{}, ErrPassengerNotFound
		}
		return domain.SavedPassenger{}, fmt.Errorf("update saved passenger: %w", err)
	}

	return updated, nil
}

func (r *postgresSavedPassengerRepo) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM saved_passengers WHERE id = $1`

	tag, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete saved passenger: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrPassengerNotFound
	}

	return nil
}
