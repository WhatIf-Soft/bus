package port

import (
	"context"

	"github.com/busexpress/services/booking/internal/domain"
	"github.com/google/uuid"
)

// HoldSeatsRequest is the input for creating a seat hold.
type HoldSeatsRequest struct {
	UserID uuid.UUID
	TripID uuid.UUID
	Seats  []SeatSelection
}

// SeatSelection couples a seat number to a passenger.
type SeatSelection struct {
	SeatNumber string
	Passenger  domain.Passenger
}

// BookingService is the application API for booking operations.
type BookingService interface {
	HoldSeats(ctx context.Context, req HoldSeatsRequest) (*domain.Booking, error)
	Confirm(ctx context.Context, userID, bookingID uuid.UUID) (*domain.Booking, error)
	Cancel(ctx context.Context, userID, bookingID uuid.UUID) (*domain.Booking, error)
	GetByID(ctx context.Context, userID, bookingID uuid.UUID) (*domain.Booking, error)
	ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Booking, int, error)
}
