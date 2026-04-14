package domain

import "errors"

// Sentinel errors for the user domain.
var (
	ErrUserNotFound       = errors.New("user not found")
	ErrEmailTaken         = errors.New("email already taken")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrSessionRevoked     = errors.New("session has been revoked")
	ErrTwoFactorRequired  = errors.New("two-factor authentication required")
	ErrInvalid2FACode     = errors.New("invalid two-factor code")
	ErrMaxSavedPassengers = errors.New("maximum 10 saved passengers reached")
	ErrNotAuthorized      = errors.New("not authorized")
)
