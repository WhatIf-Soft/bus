package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/busexpress/services/ticket/internal/domain"
	"github.com/busexpress/services/ticket/internal/port"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type repo struct {
	pool *pgxpool.Pool
}

// NewPostgresTicketRepository returns a Postgres-backed TicketRepository.
func NewPostgresTicketRepository(pool *pgxpool.Pool) port.TicketRepository {
	return &repo{pool: pool}
}

func (r *repo) CreateBatch(ctx context.Context, tickets []domain.Ticket) error {
	if len(tickets) == 0 {
		return nil
	}
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	const q = `
        INSERT INTO tickets
            (id, booking_id, user_id, trip_id, seat_number, passenger_name,
             status, qr_signature, issued_at, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7::ticket_status, $8, $9, $10)
        ON CONFLICT (booking_id, seat_number) DO NOTHING`
	for _, t := range tickets {
		if _, err := tx.Exec(ctx, q,
			t.ID, t.BookingID, t.UserID, t.TripID, t.SeatNumber, t.PassengerName,
			string(t.Status), t.QRSignature, t.IssuedAt, t.ExpiresAt,
		); err != nil {
			return fmt.Errorf("insert ticket: %w", err)
		}
	}
	return tx.Commit(ctx)
}

func (r *repo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Ticket, error) {
	const q = `
        SELECT id, booking_id, user_id, trip_id, seat_number, passenger_name,
               status, qr_signature, issued_at, used_at, expires_at
        FROM tickets WHERE id = $1`
	t := &domain.Ticket{}
	err := r.pool.QueryRow(ctx, q, id).Scan(
		&t.ID, &t.BookingID, &t.UserID, &t.TripID, &t.SeatNumber, &t.PassengerName,
		&t.Status, &t.QRSignature, &t.IssuedAt, &t.UsedAt, &t.ExpiresAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrTicketNotFound
		}
		return nil, err
	}
	return t, nil
}

func (r *repo) ListByBooking(ctx context.Context, bookingID uuid.UUID) ([]domain.Ticket, error) {
	const q = `
        SELECT id, booking_id, user_id, trip_id, seat_number, passenger_name,
               status, qr_signature, issued_at, used_at, expires_at
        FROM tickets WHERE booking_id = $1 ORDER BY seat_number`
	rows, err := r.pool.Query(ctx, q, bookingID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]domain.Ticket, 0)
	for rows.Next() {
		var t domain.Ticket
		if err := rows.Scan(
			&t.ID, &t.BookingID, &t.UserID, &t.TripID, &t.SeatNumber, &t.PassengerName,
			&t.Status, &t.QRSignature, &t.IssuedAt, &t.UsedAt, &t.ExpiresAt,
		); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r *repo) ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Ticket, int, error) {
	if limit <= 0 {
		limit = 20
	}
	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM tickets WHERE user_id = $1", userID).Scan(&total); err != nil {
		return nil, 0, err
	}
	const q = `
        SELECT id, booking_id, user_id, trip_id, seat_number, passenger_name,
               status, qr_signature, issued_at, used_at, expires_at
        FROM tickets WHERE user_id = $1
        ORDER BY issued_at DESC LIMIT $2 OFFSET $3`
	rows, err := r.pool.Query(ctx, q, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := make([]domain.Ticket, 0, limit)
	for rows.Next() {
		var t domain.Ticket
		if err := rows.Scan(
			&t.ID, &t.BookingID, &t.UserID, &t.TripID, &t.SeatNumber, &t.PassengerName,
			&t.Status, &t.QRSignature, &t.IssuedAt, &t.UsedAt, &t.ExpiresAt,
		); err != nil {
			return nil, 0, err
		}
		out = append(out, t)
	}
	return out, total, rows.Err()
}

func (r *repo) MarkUsed(ctx context.Context, id uuid.UUID, when time.Time) error {
	const q = `
        UPDATE tickets
        SET status = 'used', used_at = $1
        WHERE id = $2 AND status = 'issued'`
	tag, err := r.pool.Exec(ctx, q, when, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrAlreadyUsed
	}
	return nil
}

func (r *repo) UpdateTransfer(ctx context.Context, id uuid.UUID, newName, newQR string) error {
	const q = `
        UPDATE tickets
        SET passenger_name = $1, qr_signature = $2
        WHERE id = $3 AND status = 'issued'`
	tag, err := r.pool.Exec(ctx, q, newName, newQR, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrAlreadyUsed
	}
	return nil
}
