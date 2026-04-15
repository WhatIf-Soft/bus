package domain

import "errors"

var (
	ErrEntryNotFound        = errors.New("waitlist entry not found")
	ErrAlreadyOnWaitlist    = errors.New("user already on waitlist for this trip")
	ErrNotOwner             = errors.New("waitlist entry does not belong to user")
	ErrSeatsAvailable       = errors.New("seats are available for this trip — book directly instead")
	ErrInvalidSeats         = errors.New("seats_requested must be between 1 and 9")
	ErrTripNotFound         = errors.New("trip not found")
	ErrTooManyActiveEntries = errors.New("user has reached the maximum of 3 active waitlist entries")
)
