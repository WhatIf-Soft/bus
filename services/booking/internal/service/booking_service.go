package service

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"

	"github.com/busexpress/pkg/redis"
	"github.com/busexpress/services/booking/internal/domain"
	"github.com/busexpress/services/booking/internal/port"
)

// Config holds tunables for the booking service.
type Config struct {
	LockTTL      time.Duration // Redlock TTL for seat locks (CLAUDE.md §5.1: 600s)
	WaitlistURL  string        // base URL of waitlist-service for cancel → fan-out
}

type bookingService struct {
	repo    port.BookingRepository
	trips   port.TripClient
	redlock *redis.Redlock
	cfg     Config
}

// NewBookingService wires the booking application service.
func NewBookingService(repo port.BookingRepository, trips port.TripClient, redlock *redis.Redlock, cfg Config) port.BookingService {
	if cfg.LockTTL == 0 {
		cfg.LockTTL = 10 * time.Minute
	}
	return &bookingService{repo: repo, trips: trips, redlock: redlock, cfg: cfg}
}

// applyDiscount returns the price for a passenger after category discount.
// Defaults per CLAUDE.md §7.1: child 50%, senior 20%, student 0% (configurable later).
func applyDiscount(basePriceCents int, cat domain.PassengerCategory) int {
	switch cat {
	case domain.CategoryChild:
		return basePriceCents / 2
	case domain.CategorySenior:
		return basePriceCents * 80 / 100
	default:
		return basePriceCents
	}
}

func seatLockKey(tripID uuid.UUID, seatNumber string) string {
	return fmt.Sprintf("seat:%s:%s", tripID, seatNumber)
}

func (s *bookingService) HoldSeats(ctx context.Context, req port.HoldSeatsRequest) (*domain.Booking, error) {
	if len(req.Seats) == 0 {
		return nil, domain.ErrNoSeats
	}
	if len(req.Seats) > 9 {
		return nil, domain.ErrTooManySeats
	}

	trip, err := s.trips.GetTrip(ctx, req.TripID)
	if err != nil {
		return nil, err
	}
	if trip.AvailableSeats < len(req.Seats) {
		return nil, domain.ErrInsufficientSeats
	}

	bookingID := uuid.New()
	lockToken := bookingID.String()

	// Sequential acquisition with rollback on partial failure.
	acquired := make([]string, 0, len(req.Seats))
	for _, sel := range req.Seats {
		key := seatLockKey(req.TripID, sel.SeatNumber)
		ok, lockErr := s.redlock.Lock(ctx, key, lockToken, s.cfg.LockTTL)
		if lockErr != nil || !ok {
			for _, k := range acquired {
				_ = s.redlock.Unlock(ctx, k, lockToken)
			}
			if lockErr != nil {
				return nil, fmt.Errorf("redlock acquire %s: %w", key, lockErr)
			}
			return nil, domain.ErrSeatUnavailable
		}
		acquired = append(acquired, key)
	}

	now := time.Now().UTC()
	booking := &domain.Booking{
		ID:            bookingID,
		UserID:        req.UserID,
		TripID:        req.TripID,
		Status:        domain.StatusPendingPayment,
		Currency:      trip.Currency,
		LockExpiresAt: now.Add(s.cfg.LockTTL),
		CreatedAt:     now,
		UpdatedAt:     now,
		Seats:         make([]domain.BookingSeat, 0, len(req.Seats)),
	}
	total := 0
	for _, sel := range req.Seats {
		price := applyDiscount(trip.PriceCents, sel.Passenger.Category)
		total += price
		booking.Seats = append(booking.Seats, domain.BookingSeat{
			SeatNumber: sel.SeatNumber,
			Passenger:  sel.Passenger,
			PriceCents: price,
		})
	}
	booking.TotalPriceCents = total

	if err := s.repo.Create(ctx, booking); err != nil {
		for _, k := range acquired {
			_ = s.redlock.Unlock(ctx, k, lockToken)
		}
		return nil, err
	}
	return booking, nil
}

func (s *bookingService) Confirm(ctx context.Context, userID, bookingID uuid.UUID) (*domain.Booking, error) {
	b, err := s.repo.GetByID(ctx, bookingID)
	if err != nil {
		return nil, err
	}
	if b.UserID != userID {
		return nil, domain.ErrNotOwner
	}
	if err := domain.Transition(b.Status, domain.StatusConfirmed); err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	if err := s.repo.UpdateStatus(ctx, bookingID, b.Status, domain.StatusConfirmed, now); err != nil {
		return nil, err
	}
	b.Status = domain.StatusConfirmed
	b.ConfirmedAt = &now
	b.UpdatedAt = now
	return b, nil
}

func (s *bookingService) Cancel(ctx context.Context, userID, bookingID uuid.UUID) (*domain.Booking, error) {
	b, err := s.repo.GetByID(ctx, bookingID)
	if err != nil {
		return nil, err
	}
	if b.UserID != userID {
		return nil, domain.ErrNotOwner
	}
	if err := domain.Transition(b.Status, domain.StatusCancelled); err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	if err := s.repo.UpdateStatus(ctx, bookingID, b.Status, domain.StatusCancelled, now); err != nil {
		return nil, err
	}

	for _, seat := range b.Seats {
		_ = s.redlock.Unlock(ctx, seatLockKey(b.TripID, seat.SeatNumber), b.ID.String())
	}

	// Best-effort waitlist fan-out (CLAUDE.md §7.5).
	s.notifyWaitlist(b.TripID)

	b.Status = domain.StatusCancelled
	b.CancelledAt = &now
	b.UpdatedAt = now
	return b, nil
}

func (s *bookingService) notifyWaitlist(tripID uuid.UUID) {
	if s.cfg.WaitlistURL == "" {
		return
	}
	go func() {
		url := fmt.Sprintf("%s/api/v1/waitlist/check?trip_id=%s", s.cfg.WaitlistURL, tripID)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, nil)
		if err != nil {
			return
		}
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return
		}
		_ = resp.Body.Close()
	}()
}

func (s *bookingService) GetByID(ctx context.Context, userID, bookingID uuid.UUID) (*domain.Booking, error) {
	b, err := s.repo.GetByID(ctx, bookingID)
	if err != nil {
		return nil, err
	}
	if b.UserID != userID {
		return nil, domain.ErrNotOwner
	}
	return b, nil
}

func (s *bookingService) ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Booking, int, error) {
	return s.repo.ListByUser(ctx, userID, limit, offset)
}
