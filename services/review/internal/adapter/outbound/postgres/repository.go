package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/busexpress/services/review/internal/domain"
	"github.com/busexpress/services/review/internal/port"
)

type repo struct{ pool *pgxpool.Pool }

// NewPostgresReviewRepository returns a Postgres-backed ReviewRepository.
func NewPostgresReviewRepository(pool *pgxpool.Pool) port.ReviewRepository {
	return &repo{pool: pool}
}

func (r *repo) Create(ctx context.Context, x *domain.Review) error {
	const q = `
        INSERT INTO reviews
            (id, user_id, operator_id, booking_id, rating, title, body, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::review_status, $9, $10)`
	_, err := r.pool.Exec(ctx, q,
		x.ID, x.UserID, x.OperatorID, x.BookingID, x.Rating, x.Title, x.Body,
		string(x.Status), x.CreatedAt, x.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return domain.ErrAlreadyReviewed
		}
		return fmt.Errorf("insert review: %w", err)
	}
	return nil
}

func (r *repo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Review, error) {
	const q = `
        SELECT id, user_id, operator_id, booking_id, rating, title, body, status,
               operator_reply, operator_replied_at, created_at, updated_at
        FROM reviews WHERE id = $1`
	v := &domain.Review{}
	err := r.pool.QueryRow(ctx, q, id).Scan(
		&v.ID, &v.UserID, &v.OperatorID, &v.BookingID, &v.Rating,
		&v.Title, &v.Body, &v.Status, &v.OperatorReply, &v.OperatorRepliedAt,
		&v.CreatedAt, &v.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrReviewNotFound
		}
		return nil, err
	}
	return v, nil
}

func (r *repo) GetByBookingAndUser(ctx context.Context, bookingID, userID uuid.UUID) (*domain.Review, error) {
	const q = `
        SELECT id, user_id, operator_id, booking_id, rating, title, body, status,
               operator_reply, operator_replied_at, created_at, updated_at
        FROM reviews WHERE booking_id = $1 AND user_id = $2`
	v := &domain.Review{}
	err := r.pool.QueryRow(ctx, q, bookingID, userID).Scan(
		&v.ID, &v.UserID, &v.OperatorID, &v.BookingID, &v.Rating,
		&v.Title, &v.Body, &v.Status, &v.OperatorReply, &v.OperatorRepliedAt,
		&v.CreatedAt, &v.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrReviewNotFound
		}
		return nil, err
	}
	return v, nil
}

func (r *repo) ListByOperator(ctx context.Context, opID uuid.UUID, limit, offset int) ([]domain.Review, int, error) {
	if limit <= 0 {
		limit = 20
	}
	var total int
	if err := r.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM reviews WHERE operator_id = $1 AND status = 'published'", opID,
	).Scan(&total); err != nil {
		return nil, 0, err
	}
	const q = `
        SELECT id, user_id, operator_id, booking_id, rating, title, body, status,
               operator_reply, operator_replied_at, created_at, updated_at
        FROM reviews WHERE operator_id = $1 AND status = 'published'
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`
	rows, err := r.pool.Query(ctx, q, opID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := make([]domain.Review, 0, limit)
	for rows.Next() {
		var v domain.Review
		if err := rows.Scan(
			&v.ID, &v.UserID, &v.OperatorID, &v.BookingID, &v.Rating,
			&v.Title, &v.Body, &v.Status, &v.OperatorReply, &v.OperatorRepliedAt,
			&v.CreatedAt, &v.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		out = append(out, v)
	}
	return out, total, rows.Err()
}

func (r *repo) ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Review, int, error) {
	if limit <= 0 {
		limit = 20
	}
	var total int
	if err := r.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM reviews WHERE user_id = $1", userID,
	).Scan(&total); err != nil {
		return nil, 0, err
	}
	const q = `
        SELECT id, user_id, operator_id, booking_id, rating, title, body, status,
               operator_reply, operator_replied_at, created_at, updated_at
        FROM reviews WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`
	rows, err := r.pool.Query(ctx, q, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := make([]domain.Review, 0, limit)
	for rows.Next() {
		var v domain.Review
		if err := rows.Scan(
			&v.ID, &v.UserID, &v.OperatorID, &v.BookingID, &v.Rating,
			&v.Title, &v.Body, &v.Status, &v.OperatorReply, &v.OperatorRepliedAt,
			&v.CreatedAt, &v.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		out = append(out, v)
	}
	return out, total, rows.Err()
}

func (r *repo) Aggregate(ctx context.Context, opID uuid.UUID) (*domain.Aggregate, error) {
	const q = `
        SELECT
            COALESCE(AVG(rating), 0)::float AS avg,
            COUNT(*)::int               AS cnt,
            COUNT(*) FILTER (WHERE rating = 1) AS r1,
            COUNT(*) FILTER (WHERE rating = 2) AS r2,
            COUNT(*) FILTER (WHERE rating = 3) AS r3,
            COUNT(*) FILTER (WHERE rating = 4) AS r4,
            COUNT(*) FILTER (WHERE rating = 5) AS r5
        FROM reviews
        WHERE operator_id = $1 AND status = 'published'`
	a := &domain.Aggregate{OperatorID: opID, Histogram: map[int]int{}}
	var r1, r2, r3, r4, r5 int
	if err := r.pool.QueryRow(ctx, q, opID).Scan(&a.Average, &a.Count, &r1, &r2, &r3, &r4, &r5); err != nil {
		return nil, err
	}
	a.Histogram[1] = r1
	a.Histogram[2] = r2
	a.Histogram[3] = r3
	a.Histogram[4] = r4
	a.Histogram[5] = r5
	return a, nil
}

func (r *repo) SetReply(ctx context.Context, id uuid.UUID, reply string) error {
	const q = `
        UPDATE reviews
        SET operator_reply = $1, operator_replied_at = NOW(), updated_at = NOW()
        WHERE id = $2`
	tag, err := r.pool.Exec(ctx, q, reply, id)
	if err != nil {
		return fmt.Errorf("set reply: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrReviewNotFound
	}
	return nil
}
