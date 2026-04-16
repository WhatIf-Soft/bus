// Package events defines the shared event types published to Kafka topics.
// All services import from here to avoid drift between producers and consumers.
package events

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// Topics per CLAUDE.md §2.
const (
	TopicBookingEvents      = "booking-events"
	TopicPaymentEvents      = "payment-events"
	TopicNotificationEvents = "notification-events"
)

// BookingEvent is published when a booking transitions state.
type BookingEvent struct {
	BookingID uuid.UUID `json:"booking_id"`
	UserID    uuid.UUID `json:"user_id"`
	TripID    uuid.UUID `json:"trip_id"`
	Status    string    `json:"status"`
	Seats     int       `json:"seats"`
	Timestamp time.Time `json:"timestamp"`
}

// PaymentEvent is published when a payment transitions state.
type PaymentEvent struct {
	PaymentID   uuid.UUID `json:"payment_id"`
	BookingID   uuid.UUID `json:"booking_id"`
	UserID      uuid.UUID `json:"user_id"`
	AmountCents int       `json:"amount_cents"`
	Currency    string    `json:"currency"`
	Method      string    `json:"method"`
	Status      string    `json:"status"`
	Timestamp   time.Time `json:"timestamp"`
}

// Marshal serializes an event to JSON bytes.
func Marshal(v any) []byte {
	b, _ := json.Marshal(v)
	return b
}
