package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/busexpress/services/waitlist/internal/domain"
	"github.com/busexpress/services/waitlist/internal/port"
)

type repo struct{ pool *pgxpool.Pool }

// NewPostgresWaitlistRepository constructs a Postgres-backed repository.
func NewPostgresWaitlistRepository(pool *pgxpool.Pool) port.WaitlistRepository {
	return &repo{pool: pool}
}

func (r *repo) Create(ctx context.Context, e *domain.Entry) error {
	const q = `
        INSERT INTO waitlist_entries
            (id, user_id, trip_id, seats_requested, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5::waitlist_status, $6, $7)`
	_, err := r.pool.Exec(ctx, q,
		e.ID, e.UserID, e.TripID, e.SeatsRequested, string(e.Status),
		e.CreatedAt, e.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.ErrAlreadyOnWaitlist
		}
		return fmt.Errorf("insert waitlist entry: %w", err)
	}
	return nil
}

func scanEntry(row interface{ Scan(...any) error }) (*domain.Entry, error) {
	e := &domain.Entry{}
	err := row.Scan(
		&e.ID, &e.UserID, &e.TripID, &e.SeatsRequested, &e.Status,
		&e.NotifiedAt, &e.ConfirmDeadline, &e.FulfilledBookingID, &e.CancelledAt,
		&e.CreatedAt, &e.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return e, nil
}

const selectColumns = `id, user_id, trip_id, seats_requested, status,
       notified_at, confirm_deadline, fulfilled_booking_id, cancelled_at,
       created_at, updated_at`

func (r *repo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Entry, error) {
	q := "SELECT " + selectColumns + " FROM waitlist_entries WHERE id = $1"
	e, err := scanEntry(r.pool.QueryRow(ctx, q, id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrEntryNotFound
		}
		return nil, err
	}
	return e, nil
}

func (r *repo) ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Entry, int, error) {
	if limit <= 0 {
		limit = 20
	}
	var total int
	if err := r.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM waitlist_entries WHERE user_id = $1", userID,
	).Scan(&total); err != nil {
		return nil, 0, err
	}
	q := "SELECT " + selectColumns +
		" FROM waitlist_entries WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
	rows, err := r.pool.Query(ctx, q, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := make([]domain.Entry, 0, limit)
	for rows.Next() {
		e, err := scanEntry(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, *e)
	}
	return out, total, rows.Err()
}

func (r *repo) ListByTrip(ctx context.Context, tripID uuid.UUID) ([]domain.Entry, error) {
	q := "SELECT " + selectColumns +
		" FROM waitlist_entries WHERE trip_id = $1 ORDER BY created_at"
	rows, err := r.pool.Query(ctx, q, tripID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]domain.Entry, 0)
	for rows.Next() {
		e, err := scanEntry(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *e)
	}
	return out, rows.Err()
}

func (r *repo) CountActiveByUser(ctx context.Context, userID uuid.UUID) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM waitlist_entries
         WHERE user_id = $1 AND status IN ('queued', 'notified')`,
		userID,
	).Scan(&n)
	return n, err
}

func (r *repo) NextQueued(ctx context.Context, tripID uuid.UUID) (*domain.Entry, error) {
	q := "SELECT " + selectColumns +
		" FROM waitlist_entries WHERE trip_id = $1 AND status = 'queued' ORDER BY created_at LIMIT 1"
	e, err := scanEntry(r.pool.QueryRow(ctx, q, tripID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil // empty queue is not an error
		}
		return nil, err
	}
	return e, nil
}

func (r *repo) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.Status) error {
	tag, err := r.pool.Exec(ctx,
		"UPDATE waitlist_entries SET status = $1::waitlist_status, updated_at = NOW() WHERE id = $2",
		string(status), id,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntryNotFound
	}
	return nil
}

func (r *repo) MarkNotified(ctx context.Context, id uuid.UUID, deadline time.Time) error {
	tag, err := r.pool.Exec(ctx, `
        UPDATE waitlist_entries
        SET status = 'notified', notified_at = NOW(), confirm_deadline = $1, updated_at = NOW()
        WHERE id = $2 AND status = 'queued'`,
		deadline, id,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntryNotFound
	}
	return nil
}

func (r *repo) MarkFulfilled(ctx context.Context, id uuid.UUID, bookingID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `
        UPDATE waitlist_entries
        SET status = 'fulfilled', fulfilled_booking_id = $1, updated_at = NOW()
        WHERE id = $2 AND status IN ('notified', 'queued')`,
		bookingID, id,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntryNotFound
	}
	return nil
}

func (r *repo) MarkCancelled(ctx context.Context, id uuid.UUID, when time.Time) error {
	tag, err := r.pool.Exec(ctx, `
        UPDATE waitlist_entries
        SET status = 'cancelled', cancelled_at = $1, updated_at = NOW()
        WHERE id = $2 AND status IN ('queued', 'notified')`,
		when, id,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntryNotFound
	}
	return nil
}

func (r *repo) ExpireNotified(ctx context.Context, before time.Time) (int, error) {
	tag, err := r.pool.Exec(ctx, `
        UPDATE waitlist_entries
        SET status = 'expired', updated_at = NOW()
        WHERE status = 'notified' AND confirm_deadline < $1`, before,
	)
	if err != nil {
		return 0, err
	}
	return int(tag.RowsAffected()), nil
}
