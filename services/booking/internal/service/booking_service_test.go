package service

import (
	"context"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/busexpress/services/booking/internal/domain"
	"github.com/busexpress/services/booking/internal/port"
)

// --- Mock TripClient ---

type mockTripClient struct {
	trip *domain.Trip
	err  error
}

func (m *mockTripClient) GetTrip(_ context.Context, _ uuid.UUID) (*domain.Trip, error) {
	return m.trip, m.err
}

// --- Mock Repository ---

type mockRepo struct {
	mu       sync.Mutex
	bookings map[uuid.UUID]*domain.Booking
}

func newMockRepo() *mockRepo {
	return &mockRepo{bookings: make(map[uuid.UUID]*domain.Booking)}
}

func (r *mockRepo) Create(_ context.Context, b *domain.Booking) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	cp := *b
	cp.Seats = make([]domain.BookingSeat, len(b.Seats))
	copy(cp.Seats, b.Seats)
	r.bookings[b.ID] = &cp
	return nil
}

func (r *mockRepo) GetByID(_ context.Context, id uuid.UUID) (*domain.Booking, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	b, ok := r.bookings[id]
	if !ok {
		return nil, domain.ErrBookingNotFound
	}
	cp := *b
	return &cp, nil
}

func (r *mockRepo) ListByUser(_ context.Context, userID uuid.UUID, limit, offset int) ([]domain.Booking, int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	var out []domain.Booking
	for _, b := range r.bookings {
		if b.UserID == userID {
			out = append(out, *b)
		}
	}
	return out, len(out), nil
}

func (r *mockRepo) UpdateStatus(_ context.Context, id uuid.UUID, from, to domain.Status, when time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	b, ok := r.bookings[id]
	if !ok {
		return domain.ErrBookingNotFound
	}
	if b.Status != from {
		return domain.ErrInvalidTransition
	}
	b.Status = to
	b.UpdatedAt = when
	if to == domain.StatusConfirmed {
		b.ConfirmedAt = &when
	}
	if to == domain.StatusCancelled {
		b.CancelledAt = &when
	}
	return nil
}

func (r *mockRepo) ExpirePendingSeats(_ context.Context, before time.Time) (int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	n := 0
	for _, b := range r.bookings {
		if (b.Status == domain.StatusPendingSeat || b.Status == domain.StatusPendingPayment) && b.LockExpiresAt.Before(before) {
			b.Status = domain.StatusExpired
			n++
		}
	}
	return n, nil
}

// --- Helpers ---

func testTrip() *domain.Trip {
	return &domain.Trip{
		ID:             uuid.New(),
		PriceCents:     100000,
		Currency:       "XOF",
		AvailableSeats: 50,
		TotalSeats:     50,
	}
}

func testSeats(n int) []port.SeatSelection {
	seats := make([]port.SeatSelection, n)
	for i := range n {
		seats[i] = port.SeatSelection{
			SeatNumber: string(rune('A'+i)) + "1",
			Passenger: domain.Passenger{
				FirstName: "Test",
				LastName:  "User",
				Category:  domain.CategoryAdult,
			},
		}
	}
	return seats
}

// --- Tests ---

func TestHoldSeats_Happy(t *testing.T) {
	trip := testTrip()
	repo := newMockRepo()
	trips := &mockTripClient{trip: trip}

	// Use a nil redlock — the mock repo doesn't validate locks.
	// In production, integration tests exercise real Redlock.
	svc := &bookingService{
		repo:  repo,
		trips: trips,
		cfg:   Config{LockTTL: 10 * time.Minute},
	}

	userID := uuid.New()
	b, err := svc.HoldSeats(context.Background(), port.HoldSeatsRequest{
		UserID: userID,
		TripID: trip.ID,
		Seats:  testSeats(2),
	})
	if err != nil {
		t.Fatalf("HoldSeats: %v", err)
	}
	if b.Status != domain.StatusPendingPayment {
		t.Fatalf("expected pending_payment, got %s", b.Status)
	}
	if len(b.Seats) != 2 {
		t.Fatalf("expected 2 seats, got %d", len(b.Seats))
	}
	if b.TotalPriceCents != 200000 {
		t.Fatalf("expected 200000 cents, got %d", b.TotalPriceCents)
	}
}

func TestHoldSeats_TooManySeats(t *testing.T) {
	trip := testTrip()
	repo := newMockRepo()
	trips := &mockTripClient{trip: trip}
	svc := &bookingService{repo: repo, trips: trips, cfg: Config{LockTTL: 10 * time.Minute}}

	_, err := svc.HoldSeats(context.Background(), port.HoldSeatsRequest{
		UserID: uuid.New(),
		TripID: trip.ID,
		Seats:  testSeats(10),
	})
	if err != domain.ErrTooManySeats {
		t.Fatalf("expected ErrTooManySeats, got %v", err)
	}
}

func TestHoldSeats_NoSeats(t *testing.T) {
	svc := &bookingService{cfg: Config{LockTTL: 10 * time.Minute}}
	_, err := svc.HoldSeats(context.Background(), port.HoldSeatsRequest{
		UserID: uuid.New(),
		TripID: uuid.New(),
		Seats:  nil,
	})
	if err != domain.ErrNoSeats {
		t.Fatalf("expected ErrNoSeats, got %v", err)
	}
}

func TestHoldSeats_InsufficientSeats(t *testing.T) {
	trip := testTrip()
	trip.AvailableSeats = 1
	repo := newMockRepo()
	trips := &mockTripClient{trip: trip}
	svc := &bookingService{repo: repo, trips: trips, cfg: Config{LockTTL: 10 * time.Minute}}

	_, err := svc.HoldSeats(context.Background(), port.HoldSeatsRequest{
		UserID: uuid.New(),
		TripID: trip.ID,
		Seats:  testSeats(3),
	})
	if err != domain.ErrInsufficientSeats {
		t.Fatalf("expected ErrInsufficientSeats, got %v", err)
	}
}

func TestHoldSeats_ChildDiscount(t *testing.T) {
	trip := testTrip()
	trip.PriceCents = 10000
	repo := newMockRepo()
	trips := &mockTripClient{trip: trip}
	svc := &bookingService{repo: repo, trips: trips, cfg: Config{LockTTL: 10 * time.Minute}}

	seats := []port.SeatSelection{
		{SeatNumber: "A1", Passenger: domain.Passenger{FirstName: "A", LastName: "B", Category: domain.CategoryAdult}},
		{SeatNumber: "A2", Passenger: domain.Passenger{FirstName: "C", LastName: "D", Category: domain.CategoryChild}},
		{SeatNumber: "A3", Passenger: domain.Passenger{FirstName: "E", LastName: "F", Category: domain.CategorySenior}},
	}
	b, err := svc.HoldSeats(context.Background(), port.HoldSeatsRequest{
		UserID: uuid.New(), TripID: trip.ID, Seats: seats,
	})
	if err != nil {
		t.Fatal(err)
	}
	// adult=10000, child=5000 (50%), senior=8000 (80%)
	expected := 10000 + 5000 + 8000
	if b.TotalPriceCents != expected {
		t.Fatalf("expected %d, got %d", expected, b.TotalPriceCents)
	}
}

func TestConfirm_Happy(t *testing.T) {
	trip := testTrip()
	repo := newMockRepo()
	trips := &mockTripClient{trip: trip}
	svc := &bookingService{repo: repo, trips: trips, cfg: Config{LockTTL: 10 * time.Minute}}

	userID := uuid.New()
	b, _ := svc.HoldSeats(context.Background(), port.HoldSeatsRequest{
		UserID: userID, TripID: trip.ID, Seats: testSeats(1),
	})

	confirmed, err := svc.Confirm(context.Background(), userID, b.ID)
	if err != nil {
		t.Fatalf("Confirm: %v", err)
	}
	if confirmed.Status != domain.StatusConfirmed {
		t.Fatalf("expected confirmed, got %s", confirmed.Status)
	}
}

func TestConfirm_NotOwner(t *testing.T) {
	trip := testTrip()
	repo := newMockRepo()
	trips := &mockTripClient{trip: trip}
	svc := &bookingService{repo: repo, trips: trips, cfg: Config{LockTTL: 10 * time.Minute}}

	b, _ := svc.HoldSeats(context.Background(), port.HoldSeatsRequest{
		UserID: uuid.New(), TripID: trip.ID, Seats: testSeats(1),
	})

	_, err := svc.Confirm(context.Background(), uuid.New(), b.ID)
	if err != domain.ErrNotOwner {
		t.Fatalf("expected ErrNotOwner, got %v", err)
	}
}

func TestCancel_Happy(t *testing.T) {
	trip := testTrip()
	repo := newMockRepo()
	trips := &mockTripClient{trip: trip}
	svc := &bookingService{repo: repo, trips: trips, cfg: Config{LockTTL: 10 * time.Minute}}

	userID := uuid.New()
	b, _ := svc.HoldSeats(context.Background(), port.HoldSeatsRequest{
		UserID: userID, TripID: trip.ID, Seats: testSeats(1),
	})

	cancelled, err := svc.Cancel(context.Background(), userID, b.ID)
	if err != nil {
		t.Fatalf("Cancel: %v", err)
	}
	if cancelled.Status != domain.StatusCancelled {
		t.Fatalf("expected cancelled, got %s", cancelled.Status)
	}
}

func TestConfirm_AlreadyConfirmed(t *testing.T) {
	trip := testTrip()
	repo := newMockRepo()
	trips := &mockTripClient{trip: trip}
	svc := &bookingService{repo: repo, trips: trips, cfg: Config{LockTTL: 10 * time.Minute}}

	userID := uuid.New()
	b, _ := svc.HoldSeats(context.Background(), port.HoldSeatsRequest{
		UserID: userID, TripID: trip.ID, Seats: testSeats(1),
	})
	svc.Confirm(context.Background(), userID, b.ID)

	_, err := svc.Confirm(context.Background(), userID, b.ID)
	if err == nil {
		t.Fatal("expected error on double-confirm")
	}
}

func TestExpirePendingSeats(t *testing.T) {
	trip := testTrip()
	repo := newMockRepo()
	trips := &mockTripClient{trip: trip}
	svc := &bookingService{repo: repo, trips: trips, cfg: Config{LockTTL: 1 * time.Millisecond}}

	userID := uuid.New()
	svc.HoldSeats(context.Background(), port.HoldSeatsRequest{
		UserID: userID, TripID: trip.ID, Seats: testSeats(1),
	})

	time.Sleep(5 * time.Millisecond)
	n, err := repo.ExpirePendingSeats(context.Background(), time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if n != 1 {
		t.Fatalf("expected 1 expired, got %d", n)
	}
}

func TestConcurrentHoldSeats_Conflict(t *testing.T) {
	trip := testTrip()
	trip.AvailableSeats = 50

	var successes atomic.Int32
	var failures atomic.Int32
	var wg sync.WaitGroup

	for i := range 100 {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			repo := newMockRepo()
			trips := &mockTripClient{trip: trip}
			svc := &bookingService{repo: repo, trips: trips, cfg: Config{LockTTL: 10 * time.Minute}}

			_, err := svc.HoldSeats(context.Background(), port.HoldSeatsRequest{
				UserID: uuid.New(),
				TripID: trip.ID,
				Seats:  testSeats(1),
			})
			if err != nil {
				failures.Add(1)
			} else {
				successes.Add(1)
			}
		}(i)
	}
	wg.Wait()

	// Without real Redlock (nil), all succeed against independent mock repos.
	// This test validates the service logic doesn't panic under concurrency.
	// The real Redlock concurrency test belongs in integration tests with Redis.
	if successes.Load() == 0 {
		t.Fatal("expected some successes")
	}
	t.Logf("concurrent: %d successes, %d failures", successes.Load(), failures.Load())
}
