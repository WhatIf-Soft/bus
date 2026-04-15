package domain

import (
	"time"

	"github.com/google/uuid"
)

// Status is the lifecycle state of a waitlist entry.
type Status string

const (
	StatusQueued    Status = "queued"
	StatusNotified  Status = "notified"
	StatusExpired   Status = "expired"
	StatusCancelled Status = "cancelled"
	StatusFulfilled Status = "fulfilled"
)

// Entry is one passenger's request to be queued for a trip that may sell out.
type Entry struct {
	ID                  uuid.UUID
	UserID              uuid.UUID
	TripID              uuid.UUID
	SeatsRequested      int
	Status              Status
	NotifiedAt          *time.Time
	ConfirmDeadline     *time.Time
	FulfilledBookingID  *uuid.UUID
	CancelledAt         *time.Time
	CreatedAt           time.Time
	UpdatedAt           time.Time
}
