package port

import (
	"context"

	"github.com/google/uuid"
)

// BookingInfo captures the price and ownership data needed to validate a payment.
type BookingInfo struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	TotalPriceCents int
	Currency        string
	Status          string
}

// BookingClient lets the payment service talk to booking-service.
// It uses the caller's bearer token so authorization is preserved.
type BookingClient interface {
	GetBooking(ctx context.Context, bearerToken string, bookingID uuid.UUID) (*BookingInfo, error)
	Confirm(ctx context.Context, bearerToken string, bookingID uuid.UUID) error
	Cancel(ctx context.Context, bearerToken string, bookingID uuid.UUID) error
}
