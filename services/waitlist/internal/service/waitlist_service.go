package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/busexpress/services/waitlist/internal/domain"
	"github.com/busexpress/services/waitlist/internal/port"
)

// Confirm window when notified — CLAUDE.md §7.5 specifies 15 minutes.
const confirmWindow = 15 * time.Minute

// Per CLAUDE.md §7.5, max 3 active waitlist entries per user.
const maxActiveEntries = 3

type waitlistService struct {
	repo     port.WaitlistRepository
	trips    port.TripClient
	notifier port.Notifier
}

// NewWaitlistService wires the application service.
func NewWaitlistService(repo port.WaitlistRepository, trips port.TripClient, notifier port.Notifier) port.WaitlistService {
	return &waitlistService{repo: repo, trips: trips, notifier: notifier}
}

func (s *waitlistService) Join(ctx context.Context, bearerToken string, req port.JoinRequest) (*domain.Entry, error) {
	if req.SeatsRequested < 1 || req.SeatsRequested > 9 {
		return nil, domain.ErrInvalidSeats
	}
	avail, err := s.trips.GetAvailability(ctx, req.TripID)
	if err != nil {
		return nil, err
	}
	if avail.AvailableSeats >= req.SeatsRequested {
		return nil, domain.ErrSeatsAvailable
	}
	active, err := s.repo.CountActiveByUser(ctx, req.UserID)
	if err != nil {
		return nil, err
	}
	if active >= maxActiveEntries {
		return nil, domain.ErrTooManyActiveEntries
	}
	now := time.Now().UTC()
	e := &domain.Entry{
		ID: uuid.New(), UserID: req.UserID, TripID: req.TripID,
		SeatsRequested: req.SeatsRequested, Status: domain.StatusQueued,
		CreatedAt: now, UpdatedAt: now,
	}
	if err := s.repo.Create(ctx, e); err != nil {
		return nil, err
	}
	return e, nil
}

func (s *waitlistService) ListMine(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Entry, int, error) {
	return s.repo.ListByUser(ctx, userID, limit, offset)
}

func (s *waitlistService) GetByID(ctx context.Context, userID, id uuid.UUID) (*domain.Entry, error) {
	e, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if e.UserID != userID {
		return nil, domain.ErrNotOwner
	}
	return e, nil
}

func (s *waitlistService) Cancel(ctx context.Context, userID, id uuid.UUID) (*domain.Entry, error) {
	e, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if e.UserID != userID {
		return nil, domain.ErrNotOwner
	}
	if err := s.repo.MarkCancelled(ctx, id, time.Now().UTC()); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

// CheckAndNotify scans the queue for `tripID`. If seats are available and a
// queued entry exists, advance it to `notified` and dispatch a notification.
// Returns the entry that was advanced, or nil if no work was done.
func (s *waitlistService) CheckAndNotify(ctx context.Context, tripID uuid.UUID) (*domain.Entry, error) {
	avail, err := s.trips.GetAvailability(ctx, tripID)
	if err != nil {
		return nil, err
	}
	next, err := s.repo.NextQueued(ctx, tripID)
	if err != nil {
		return nil, err
	}
	if next == nil {
		return nil, nil
	}
	if avail.AvailableSeats < next.SeatsRequested {
		return nil, nil
	}
	deadline := time.Now().UTC().Add(confirmWindow)
	if err := s.repo.MarkNotified(ctx, next.ID, deadline); err != nil {
		return nil, err
	}
	updated, err := s.repo.GetByID(ctx, next.ID)
	if err != nil {
		return nil, err
	}
	// Best-effort notification. We dispatch without an email recipient because
	// the sweeper has no caller token; the notification-service will drop empty
	// `to` payloads. A future Phase-2 wiring can resolve the email out-of-band.
	_ = s.notifier.NotifyAvailable(ctx, "", updated)
	return updated, nil
}
