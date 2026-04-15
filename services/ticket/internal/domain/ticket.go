package domain

import (
	"time"

	"github.com/google/uuid"
)

// Status represents the lifecycle state of a ticket.
type Status string

const (
	StatusIssued    Status = "issued"
	StatusUsed      Status = "used"
	StatusCancelled Status = "cancelled"
	StatusExpired   Status = "expired"
)

// Ticket is the issued boarding pass for one seat on a confirmed booking.
type Ticket struct {
	ID            uuid.UUID
	BookingID     uuid.UUID
	UserID        uuid.UUID
	TripID        uuid.UUID
	SeatNumber    string
	PassengerName string
	Status        Status
	QRSignature   string
	IssuedAt      time.Time
	UsedAt        *time.Time
	ExpiresAt     time.Time
}
