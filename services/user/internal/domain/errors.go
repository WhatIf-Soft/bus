package domain

import "errors"

// Sentinel errors for the user domain.
var (
	ErrUserNotFound      = errors.New("user not found")
	ErrEmailTaken        = errors.New("email already taken")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrSessionRevoked    = errors.New("session has been revoked")
	ErrTwoFactorRequired = errors.New("two-factor authentication required")
)
