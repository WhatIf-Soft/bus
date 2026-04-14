package errors

import (
	stderrors "errors"
	"fmt"
	"net/http"
)

// AppError is a structured application error with an error code,
// human-readable message, HTTP status, and optional wrapped error.
type AppError struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	HTTPStatus int    `json:"-"`
	Err        error  `json:"-"`
}

// Error implements the error interface.
func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s: %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// Unwrap returns the wrapped error for use with errors.Is/As.
func (e *AppError) Unwrap() error {
	return e.Err
}

// NewNotFound creates a 404 Not Found error.
func NewNotFound(message string) *AppError {
	return &AppError{
		Code:       ErrNotFound,
		Message:    message,
		HTTPStatus: http.StatusNotFound,
	}
}

// NewUnauthorized creates a 401 Unauthorized error.
func NewUnauthorized(message string) *AppError {
	return &AppError{
		Code:       ErrUnauthorized,
		Message:    message,
		HTTPStatus: http.StatusUnauthorized,
	}
}

// NewForbidden creates a 403 Forbidden error.
func NewForbidden(message string) *AppError {
	return &AppError{
		Code:       ErrForbidden,
		Message:    message,
		HTTPStatus: http.StatusForbidden,
	}
}

// NewConflict creates a 409 Conflict error.
func NewConflict(message string) *AppError {
	return &AppError{
		Code:       ErrConflict,
		Message:    message,
		HTTPStatus: http.StatusConflict,
	}
}

// NewValidation creates a 422 Unprocessable Entity error.
func NewValidation(message string) *AppError {
	return &AppError{
		Code:       ErrValidation,
		Message:    message,
		HTTPStatus: http.StatusUnprocessableEntity,
	}
}

// NewInternal creates a 500 Internal Server Error.
func NewInternal(message string) *AppError {
	return &AppError{
		Code:       ErrInternal,
		Message:    message,
		HTTPStatus: http.StatusInternalServerError,
	}
}

// FromError attempts to unwrap an error into an AppError.
// If the error is not an AppError, it returns a generic internal error.
func FromError(err error) *AppError {
	var appErr *AppError
	if stderrors.As(err, &appErr) {
		return appErr
	}
	return &AppError{
		Code:       ErrInternal,
		Message:    "an unexpected error occurred",
		HTTPStatus: http.StatusInternalServerError,
		Err:        err,
	}
}
