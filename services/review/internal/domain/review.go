package domain

import (
	"time"

	"github.com/google/uuid"
)

// Status is the moderation state of a review.
type Status string

const (
	StatusPublished         Status = "published"
	StatusPendingModeration Status = "pending_moderation"
	StatusRejected          Status = "rejected"
	StatusHidden            Status = "hidden"
)

// Review captures one rating + comment left by a voyageur after a booking.
type Review struct {
	ID                uuid.UUID
	UserID            uuid.UUID
	OperatorID        uuid.UUID
	BookingID         uuid.UUID
	Rating            int
	Title             *string
	Body              *string
	Status            Status
	OperatorReply     *string
	OperatorRepliedAt *time.Time
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

// Aggregate summarises the review distribution for an operator.
type Aggregate struct {
	OperatorID uuid.UUID
	Average    float64
	Count      int
	Histogram  map[int]int // rating (1-5) → count
}
