package domain

import "errors"

var (
	ErrTrackingNotFound = errors.New("tracking session not found for trip")
	ErrNotActive        = errors.New("tracking session is not active")
)
