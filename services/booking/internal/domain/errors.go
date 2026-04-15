package domain

import "errors"

var (
	ErrSeatUnavailable    = errors.New("one or more seats are unavailable")
	ErrInvalidTransition  = errors.New("invalid booking state transition")
	ErrLockTimeout        = errors.New("seat lock acquisition timeout")
	ErrNotOwner           = errors.New("booking does not belong to user")
	ErrTripNotFound       = errors.New("trip not found")
	ErrTooManySeats       = errors.New("max 9 seats per booking")
	ErrNoSeats            = errors.New("at least one seat required")
	ErrBookingNotFound    = errors.New("booking not found")
	ErrInsufficientSeats  = errors.New("not enough available seats on trip")
)
