package http

import (
	"time"

	"github.com/busexpress/services/booking/internal/domain"
)

// PassengerInput is one passenger entry on the create booking request.
type PassengerInput struct {
	SeatNumber string `json:"seat_number" validate:"required,max=8"`
	FirstName  string `json:"first_name"  validate:"required,min=1,max=100"`
	LastName   string `json:"last_name"   validate:"required,min=1,max=100"`
	Category   string `json:"category"    validate:"required,oneof=adult child senior student"`
}

// CreateBookingRequest is the body for POST /api/v1/bookings.
type CreateBookingRequest struct {
	TripID string           `json:"trip_id" validate:"required,uuid"`
	Seats  []PassengerInput `json:"seats"   validate:"required,min=1,max=9,dive"`
}

// SeatResponse is the public representation of a booked seat.
type SeatResponse struct {
	ID         string `json:"id"`
	SeatNumber string `json:"seat_number"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	Category   string `json:"category"`
	PriceCents int    `json:"price_cents"`
}

// BookingResponse is the public representation of a booking.
type BookingResponse struct {
	ID              string         `json:"id"`
	UserID          string         `json:"user_id"`
	TripID          string         `json:"trip_id"`
	Status          string         `json:"status"`
	TotalPriceCents int            `json:"total_price_cents"`
	Currency        string         `json:"currency"`
	LockExpiresAt   time.Time      `json:"lock_expires_at"`
	ConfirmedAt     *time.Time     `json:"confirmed_at,omitempty"`
	CancelledAt     *time.Time     `json:"cancelled_at,omitempty"`
	CreatedAt       time.Time      `json:"created_at"`
	Seats           []SeatResponse `json:"seats"`
}

// ListBookingsResponse is a paginated list of bookings.
type ListBookingsResponse struct {
	Bookings []BookingResponse `json:"bookings"`
	Total    int               `json:"total"`
	Limit    int               `json:"limit"`
	Offset   int               `json:"offset"`
}

func toBookingResponse(b *domain.Booking) BookingResponse {
	seats := make([]SeatResponse, 0, len(b.Seats))
	for _, s := range b.Seats {
		seats = append(seats, SeatResponse{
			ID:         s.ID.String(),
			SeatNumber: s.SeatNumber,
			FirstName:  s.Passenger.FirstName,
			LastName:   s.Passenger.LastName,
			Category:   string(s.Passenger.Category),
			PriceCents: s.PriceCents,
		})
	}
	return BookingResponse{
		ID:              b.ID.String(),
		UserID:          b.UserID.String(),
		TripID:          b.TripID.String(),
		Status:          string(b.Status),
		TotalPriceCents: b.TotalPriceCents,
		Currency:        b.Currency,
		LockExpiresAt:   b.LockExpiresAt,
		ConfirmedAt:     b.ConfirmedAt,
		CancelledAt:     b.CancelledAt,
		CreatedAt:       b.CreatedAt,
		Seats:           seats,
	}
}
