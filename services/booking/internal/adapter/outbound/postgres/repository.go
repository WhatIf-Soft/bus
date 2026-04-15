package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/busexpress/services/booking/internal/domain"
	"github.com/busexpress/services/booking/internal/port"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type bookingRepo struct {
	pool *pgxpool.Pool
}

// NewPostgresBookingRepository creates a Postgres-backed booking repository.
func NewPostgresBookingRepository(pool *pgxpool.Pool) port.BookingRepository {
	return &bookingRepo{pool: pool}
}

func (r *bookingRepo) Create(ctx context.Context, b *domain.Booking) error {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	const insertBooking = `
        INSERT INTO bookings
            (id, user_id, trip_id, status, total_price_cents, currency,
             lock_expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	if _, err := tx.Exec(ctx, insertBooking,
		b.ID, b.UserID, b.TripID, b.Status, b.TotalPriceCents, b.Currency,
		b.LockExpiresAt, b.CreatedAt, b.UpdatedAt,
	); err != nil {
		return fmt.Errorf("insert booking: %w", err)
	}

	const insertSeat = `
        INSERT INTO booking_seats
            (id, booking_id, seat_number, passenger_first_name,
             passenger_last_name, passenger_category, price_cents)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`
	for i := range b.Seats {
		s := &b.Seats[i]
		if s.ID == uuid.Nil {
			s.ID = uuid.New()
		}
		s.BookingID = b.ID
		if _, err := tx.Exec(ctx, insertSeat,
			s.ID, s.BookingID, s.SeatNumber,
			s.Passenger.FirstName, s.Passenger.LastName, s.Passenger.Category,
			s.PriceCents,
		); err != nil {
			return fmt.Errorf("insert booking seat: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (r *bookingRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Booking, error) {
	const q = `
        SELECT id, user_id, trip_id, status, total_price_cents, currency,
               lock_expires_at, confirmed_at, cancelled_at, created_at, updated_at
        FROM bookings WHERE id = $1`
	b := &domain.Booking{}
	err := r.pool.QueryRow(ctx, q, id).Scan(
		&b.ID, &b.UserID, &b.TripID, &b.Status, &b.TotalPriceCents, &b.Currency,
		&b.LockExpiresAt, &b.ConfirmedAt, &b.CancelledAt, &b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrBookingNotFound
		}
		return nil, fmt.Errorf("get booking: %w", err)
	}

	const seatQ = `
        SELECT id, booking_id, seat_number, passenger_first_name,
               passenger_last_name, passenger_category, price_cents
        FROM booking_seats WHERE booking_id = $1 ORDER BY seat_number`
	rows, err := r.pool.Query(ctx, seatQ, id)
	if err != nil {
		return nil, fmt.Errorf("get booking seats: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var s domain.BookingSeat
		if err := rows.Scan(
			&s.ID, &s.BookingID, &s.SeatNumber,
			&s.Passenger.FirstName, &s.Passenger.LastName, &s.Passenger.Category,
			&s.PriceCents,
		); err != nil {
			return nil, err
		}
		b.Seats = append(b.Seats, s)
	}
	return b, rows.Err()
}

func (r *bookingRepo) ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Booking, int, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	var total int
	if err := r.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM bookings WHERE user_id = $1", userID,
	).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count bookings: %w", err)
	}

	const q = `
        SELECT id, user_id, trip_id, status, total_price_cents, currency,
               lock_expires_at, confirmed_at, cancelled_at, created_at, updated_at
        FROM bookings
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3`
	rows, err := r.pool.Query(ctx, q, userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list bookings: %w", err)
	}
	defer rows.Close()

	out := make([]domain.Booking, 0, limit)
	for rows.Next() {
		var b domain.Booking
		if err := rows.Scan(
			&b.ID, &b.UserID, &b.TripID, &b.Status, &b.TotalPriceCents, &b.Currency,
			&b.LockExpiresAt, &b.ConfirmedAt, &b.CancelledAt, &b.CreatedAt, &b.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		out = append(out, b)
	}
	return out, total, rows.Err()
}

func (r *bookingRepo) UpdateStatus(ctx context.Context, id uuid.UUID, from, to domain.Status, when time.Time) error {
	var confirmedAt, cancelledAt *time.Time
	switch to {
	case domain.StatusConfirmed:
		confirmedAt = &when
	case domain.StatusCancelled:
		cancelledAt = &when
	}
	const q = `
        UPDATE bookings
        SET status = $1::booking_status,
            updated_at = $2,
            confirmed_at = COALESCE($3, confirmed_at),
            cancelled_at = COALESCE($4, cancelled_at)
        WHERE id = $5 AND status = $6::booking_status`
	tag, err := r.pool.Exec(ctx, q, string(to), when, confirmedAt, cancelledAt, id, string(from))
	if err != nil {
		return fmt.Errorf("update booking status: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrInvalidTransition
	}
	return nil
}

func (r *bookingRepo) ExpirePendingSeats(ctx context.Context, before time.Time) (int, error) {
	const q = `
        UPDATE bookings
        SET status = 'expired', updated_at = NOW()
        WHERE status IN ('pending_seat', 'pending_payment')
          AND lock_expires_at < $1`
	tag, err := r.pool.Exec(ctx, q, before)
	if err != nil {
		return 0, fmt.Errorf("expire pending seats: %w", err)
	}
	return int(tag.RowsAffected()), nil
}
