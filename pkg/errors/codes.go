package errors

// Error code constants used across all BusExpress microservices.
const (
	ErrNotFound     = "NOT_FOUND"
	ErrUnauthorized = "UNAUTHORIZED"
	ErrForbidden    = "FORBIDDEN"
	ErrConflict     = "CONFLICT"
	ErrValidation   = "VALIDATION_ERROR"
	ErrInternal     = "INTERNAL_ERROR"
	ErrRateLimit    = "RATE_LIMIT_EXCEEDED"
)
