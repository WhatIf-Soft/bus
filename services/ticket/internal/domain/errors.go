package domain

import "errors"

var (
	ErrTicketNotFound      = errors.New("ticket not found")
	ErrAlreadyUsed         = errors.New("ticket already used")
	ErrTicketExpired       = errors.New("ticket has expired")
	ErrInvalidQRSignature  = errors.New("invalid QR signature")
	ErrNotOwner            = errors.New("ticket does not belong to user")
	ErrBookingNotConfirmed = errors.New("cannot issue tickets for unconfirmed booking")
)
