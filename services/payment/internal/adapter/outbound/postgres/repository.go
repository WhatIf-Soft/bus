package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/busexpress/services/payment/internal/domain"
	"github.com/busexpress/services/payment/internal/port"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type repo struct {
	pool *pgxpool.Pool
}

// NewPostgresPaymentRepository constructs a Postgres-backed payment repository.
func NewPostgresPaymentRepository(pool *pgxpool.Pool) port.PaymentRepository {
	return &repo{pool: pool}
}

func (r *repo) Create(ctx context.Context, p *domain.Payment) error {
	const q = `
        INSERT INTO payments
            (id, booking_id, user_id, amount_cents, currency, method, status,
             external_ref, msisdn, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6::payment_method, $7::payment_status,
                $8, $9, $10, $11)`
	_, err := r.pool.Exec(ctx, q,
		p.ID, p.BookingID, p.UserID, p.AmountCents, p.Currency,
		string(p.Method), string(p.Status), p.ExternalRef, p.MSISDN,
		p.CreatedAt, p.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert payment: %w", err)
	}
	return nil
}

func (r *repo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Payment, error) {
	const q = `
        SELECT id, booking_id, user_id, amount_cents, currency, method, status,
               external_ref, failure_reason, msisdn, created_at, updated_at, completed_at
        FROM payments WHERE id = $1`
	p := &domain.Payment{}
	err := r.pool.QueryRow(ctx, q, id).Scan(
		&p.ID, &p.BookingID, &p.UserID, &p.AmountCents, &p.Currency,
		&p.Method, &p.Status, &p.ExternalRef, &p.FailureReason, &p.MSISDN,
		&p.CreatedAt, &p.UpdatedAt, &p.CompletedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrPaymentNotFound
		}
		return nil, fmt.Errorf("get payment: %w", err)
	}
	return p, nil
}

func (r *repo) ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Payment, int, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	var total int
	if err := r.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM payments WHERE user_id = $1", userID,
	).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count payments: %w", err)
	}
	const q = `
        SELECT id, booking_id, user_id, amount_cents, currency, method, status,
               external_ref, failure_reason, msisdn, created_at, updated_at, completed_at
        FROM payments
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`
	rows, err := r.pool.Query(ctx, q, userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list payments: %w", err)
	}
	defer rows.Close()

	out := make([]domain.Payment, 0, limit)
	for rows.Next() {
		var p domain.Payment
		if err := rows.Scan(
			&p.ID, &p.BookingID, &p.UserID, &p.AmountCents, &p.Currency,
			&p.Method, &p.Status, &p.ExternalRef, &p.FailureReason, &p.MSISDN,
			&p.CreatedAt, &p.UpdatedAt, &p.CompletedAt,
		); err != nil {
			return nil, 0, err
		}
		out = append(out, p)
	}
	return out, total, rows.Err()
}

func (r *repo) UpdateStatus(ctx context.Context, id uuid.UUID, status domain.Status, externalRef *string, failureReason *string, completedAt *time.Time) error {
	const q = `
        UPDATE payments
        SET status = $1::payment_status,
            external_ref = COALESCE($2, external_ref),
            failure_reason = COALESCE($3, failure_reason),
            completed_at = COALESCE($4, completed_at),
            updated_at = NOW()
        WHERE id = $5`
	tag, err := r.pool.Exec(ctx, q, string(status), externalRef, failureReason, completedAt, id)
	if err != nil {
		return fmt.Errorf("update payment status: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrPaymentNotFound
	}
	return nil
}
