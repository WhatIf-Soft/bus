package domain

import "errors"

var (
	ErrTicketNotFound  = errors.New("ticket not found")
	ErrNotOwner        = errors.New("ticket does not belong to user")
	ErrNotAgent        = errors.New("agent role required")
	ErrTicketClosed    = errors.New("ticket is closed and read-only")
	ErrInvalidStatus   = errors.New("invalid status transition")
	ErrEmptyMessage    = errors.New("message body cannot be empty")
)
