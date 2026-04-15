package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/busexpress/pkg/auth"
	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
	"github.com/busexpress/pkg/validation"

	"github.com/busexpress/services/booking/internal/domain"
	"github.com/busexpress/services/booking/internal/port"
)

// Handler exposes booking endpoints.
type Handler struct {
	service port.BookingService
}

// NewHandler builds a Handler backed by the given service.
func NewHandler(svc port.BookingService) *Handler {
	return &Handler{service: svc}
}

func userIDFromCtx(r *http.Request) (uuid.UUID, error) {
	claims, err := auth.ClaimsFromContext(r.Context())
	if err != nil {
		return uuid.Nil, err
	}
	return uuid.Parse(claims.UserID)
}

// Create handles POST /api/v1/bookings.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}

	var req CreateBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON body"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}

	tripID, err := uuid.Parse(req.TripID)
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid trip_id"))
		return
	}

	seats := make([]port.SeatSelection, 0, len(req.Seats))
	for _, p := range req.Seats {
		seats = append(seats, port.SeatSelection{
			SeatNumber: p.SeatNumber,
			Passenger: domain.Passenger{
				FirstName: p.FirstName,
				LastName:  p.LastName,
				Category:  domain.PassengerCategory(p.Category),
			},
		})
	}

	booking, err := h.service.HoldSeats(r.Context(), port.HoldSeatsRequest{
		UserID: userID,
		TripID: tripID,
		Seats:  seats,
	})
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, toBookingResponse(booking))
}

// Get handles GET /api/v1/bookings/{id}.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid booking id"))
		return
	}
	b, err := h.service.GetByID(r.Context(), userID, id)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toBookingResponse(b))
}

// List handles GET /api/v1/bookings.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))

	bookings, total, err := h.service.ListByUser(r.Context(), userID, limit, offset)
	if err != nil {
		response.Error(w, err)
		return
	}
	out := make([]BookingResponse, 0, len(bookings))
	for i := range bookings {
		out = append(out, toBookingResponse(&bookings[i]))
	}
	response.JSON(w, http.StatusOK, ListBookingsResponse{
		Bookings: out, Total: total, Limit: limit, Offset: offset,
	})
}

// Confirm handles POST /api/v1/bookings/{id}/confirm.
func (h *Handler) Confirm(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid booking id"))
		return
	}
	b, err := h.service.Confirm(r.Context(), userID, id)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toBookingResponse(b))
}

// Cancel handles POST /api/v1/bookings/{id}/cancel.
func (h *Handler) Cancel(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid booking id"))
		return
	}
	b, err := h.service.Cancel(r.Context(), userID, id)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toBookingResponse(b))
}

func mapError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrBookingNotFound),
		errors.Is(err, domain.ErrTripNotFound):
		response.Error(w, apperrors.NewNotFound(err.Error()))
	case errors.Is(err, domain.ErrNotOwner):
		response.Error(w, apperrors.NewForbidden(err.Error()))
	case errors.Is(err, domain.ErrSeatUnavailable),
		errors.Is(err, domain.ErrInsufficientSeats),
		errors.Is(err, domain.ErrInvalidTransition):
		response.Error(w, apperrors.NewConflict(err.Error()))
	case errors.Is(err, domain.ErrTooManySeats),
		errors.Is(err, domain.ErrNoSeats):
		response.Error(w, apperrors.NewValidation(err.Error()))
	default:
		response.Error(w, err)
	}
}
