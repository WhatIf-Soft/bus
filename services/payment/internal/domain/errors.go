package domain

import "errors"

var (
	ErrPaymentNotFound  = errors.New("payment not found")
	ErrInvalidStatus    = errors.New("invalid payment status transition")
	ErrAlreadyTerminal  = errors.New("payment is already in a terminal state")
	ErrNotOwner         = errors.New("payment does not belong to user")
	ErrGatewayDeclined  = errors.New("payment gateway declined the transaction")
	ErrGatewayUnreach   = errors.New("payment gateway unreachable")
	ErrBookingMismatch  = errors.New("payment amount does not match booking total")
	ErrInvalidMethod    = errors.New("invalid payment method")
)
