package domain

import (
	"time"

	"github.com/google/uuid"
)

// Status represents the lifecycle state of a booking.
type Status string

const (
	StatusPendingSeat         Status = "pending_seat"
	StatusPendingPayment      Status = "pending_payment"
	StatusConfirmed           Status = "confirmed"
	StatusCancelled           Status = "cancelled"
	StatusExpired             Status = "expired"
	StatusFailed              Status = "failed"
	StatusRefunded            Status = "refunded"
	StatusUsed                Status = "used"
	StatusDisputed            Status = "disputed"
	StatusPartiallyCancelled  Status = "partially_cancelled"
	StatusPartiallyRefunded   Status = "partially_refunded"
)

// PassengerCategory drives discount calculation.
type PassengerCategory string

const (
	CategoryAdult   PassengerCategory = "adult"
	CategoryChild   PassengerCategory = "child"
	CategorySenior  PassengerCategory = "senior"
	CategoryStudent PassengerCategory = "student"
)

// Trip is the value-object snapshot of trip data needed at booking time.
type Trip struct {
	ID             uuid.UUID
	OperatorID     uuid.UUID
	PriceCents     int
	Currency       string
	AvailableSeats int
	TotalSeats     int
	BusClass       string
}

// Passenger holds the traveller details for one seat on a booking.
type Passenger struct {
	FirstName string
	LastName  string
	Category  PassengerCategory
}

// BookingSeat is one seat-passenger pairing inside a booking.
type BookingSeat struct {
	ID         uuid.UUID
	BookingID  uuid.UUID
	SeatNumber string
	Passenger  Passenger
	PriceCents int
}

// Booking is the aggregate root for a reservation.
type Booking struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	TripID          uuid.UUID
	Status          Status
	TotalPriceCents int
	Currency        string
	LockExpiresAt   time.Time
	ConfirmedAt     *time.Time
	CancelledAt     *time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
	Seats           []BookingSeat
}
