package port

import (
	"context"

	"github.com/busexpress/services/waitlist/internal/domain"
	"github.com/google/uuid"
)

// JoinRequest is the input for queuing a user on a trip.
type JoinRequest struct {
	UserID         uuid.UUID
	TripID         uuid.UUID
	SeatsRequested int
}

// TripAvailability is the slice of trip data the waitlist service needs.
type TripAvailability struct {
	TripID         uuid.UUID
	AvailableSeats int
	TotalSeats     int
}

// TripClient queries search-service for current trip availability.
type TripClient interface {
	GetAvailability(ctx context.Context, tripID uuid.UUID) (*TripAvailability, error)
}

// Notifier sends notifications when a waitlist entry advances to `notified`.
type Notifier interface {
	NotifyAvailable(ctx context.Context, recipientEmail string, entry *domain.Entry) error
}

// EmailLookup resolves the bearer's email so notifications have a recipient.
type EmailLookup interface {
	GetEmail(ctx context.Context, bearerToken string) (string, error)
}

// WaitlistService is the application API.
type WaitlistService interface {
	Join(ctx context.Context, bearerToken string, req JoinRequest) (*domain.Entry, error)
	ListMine(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Entry, int, error)
	GetByID(ctx context.Context, userID, id uuid.UUID) (*domain.Entry, error)
	Cancel(ctx context.Context, userID, id uuid.UUID) (*domain.Entry, error)

	// CheckAndNotify scans the queue for a trip and, if seats freed up, advances
	// the next queued entry to `notified` and triggers a notification.
	// Called by the periodic sweeper; safe to call from booking webhooks too.
	CheckAndNotify(ctx context.Context, tripID uuid.UUID) (*domain.Entry, error)
}
