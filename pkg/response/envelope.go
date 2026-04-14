package response

import (
	"encoding/json"
	"net/http"

	apperrors "github.com/busexpress/pkg/errors"
)

// Response is the standard API response envelope.
type Response[T any] struct {
	Success bool       `json:"success"`
	Data    T          `json:"data,omitempty"`
	Error   *ErrorBody `json:"error,omitempty"`
	Meta    *Meta      `json:"meta,omitempty"`
}

// ErrorBody contains error details in the response envelope.
type ErrorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Meta contains pagination metadata.
type Meta struct {
	Page       int   `json:"page"`
	PerPage    int   `json:"per_page"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

// JSON writes a successful JSON response with the given status code and data.
func JSON[T any](w http.ResponseWriter, status int, data T) {
	resp := Response[T]{
		Success: true,
		Data:    data,
	}
	writeJSON(w, status, resp)
}

// Error writes an error JSON response, deriving status and code from AppError.
func Error(w http.ResponseWriter, err error) {
	appErr := apperrors.FromError(err)
	resp := Response[any]{
		Success: false,
		Error: &ErrorBody{
			Code:    appErr.Code,
			Message: appErr.Message,
		},
	}
	writeJSON(w, appErr.HTTPStatus, resp)
}

// Paginated writes a successful JSON response with pagination metadata.
func Paginated[T any](w http.ResponseWriter, data T, meta Meta) {
	resp := Response[T]{
		Success: true,
		Data:    data,
		Meta:    &meta,
	}
	writeJSON(w, http.StatusOK, resp)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
