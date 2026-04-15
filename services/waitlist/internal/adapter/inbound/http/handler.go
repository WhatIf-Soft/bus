package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/busexpress/pkg/auth"
	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
	"github.com/busexpress/pkg/validation"

	"github.com/busexpress/services/waitlist/internal/domain"
	"github.com/busexpress/services/waitlist/internal/port"
)

// Handler exposes waitlist-service endpoints.
type Handler struct {
	service port.WaitlistService
}

// NewHandler builds a Handler.
func NewHandler(svc port.WaitlistService) *Handler { return &Handler{service: svc} }

func userIDFromCtx(r *http.Request) (uuid.UUID, error) {
	claims, err := auth.ClaimsFromContext(r.Context())
	if err != nil {
		return uuid.Nil, err
	}
	return uuid.Parse(claims.UserID)
}

func bearerToken(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if !strings.HasPrefix(strings.ToLower(h), "bearer ") {
		return ""
	}
	return strings.TrimSpace(h[len("Bearer "):])
}

// Join handles POST /api/v1/waitlist.
func (h *Handler) Join(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	var req JoinRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	tid, err := uuid.Parse(req.TripID)
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid trip_id"))
		return
	}
	e, err := h.service.Join(r.Context(), bearerToken(r), port.JoinRequest{
		UserID: userID, TripID: tid, SeatsRequested: req.SeatsRequested,
	})
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, toEntryResponse(e))
}

// ListMine handles GET /api/v1/waitlist/mine.
func (h *Handler) ListMine(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	entries, total, err := h.service.ListMine(r.Context(), userID, limit, offset)
	if err != nil {
		response.Error(w, err)
		return
	}
	out := make([]EntryResponse, 0, len(entries))
	for i := range entries {
		out = append(out, toEntryResponse(&entries[i]))
	}
	response.JSON(w, http.StatusOK, ListEntriesResponse{
		Entries: out, Total: total, Limit: limit, Offset: offset,
	})
}

// Get handles GET /api/v1/waitlist/{id}.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid waitlist id"))
		return
	}
	e, err := h.service.GetByID(r.Context(), userID, id)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toEntryResponse(e))
}

// Cancel handles POST /api/v1/waitlist/{id}/cancel.
func (h *Handler) Cancel(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid waitlist id"))
		return
	}
	e, err := h.service.Cancel(r.Context(), userID, id)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toEntryResponse(e))
}

// CheckAndNotify handles POST /api/v1/waitlist/check?trip_id=...
// Open in dev for manual fan-out testing; in production would be admin-only or
// invoked by booking-service via internal RPC after a cancel/refund event.
func (h *Handler) CheckAndNotify(w http.ResponseWriter, r *http.Request) {
	tidStr := r.URL.Query().Get("trip_id")
	if tidStr == "" {
		response.Error(w, apperrors.NewValidation("trip_id required"))
		return
	}
	tid, err := uuid.Parse(tidStr)
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid trip_id"))
		return
	}
	e, err := h.service.CheckAndNotify(r.Context(), tid)
	if err != nil {
		mapError(w, err)
		return
	}
	if e == nil {
		response.JSON(w, http.StatusOK, map[string]string{"status": "no-op"})
		return
	}
	response.JSON(w, http.StatusOK, toEntryResponse(e))
}

func mapError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrEntryNotFound),
		errors.Is(err, domain.ErrTripNotFound):
		response.Error(w, apperrors.NewNotFound(err.Error()))
	case errors.Is(err, domain.ErrNotOwner):
		response.Error(w, apperrors.NewForbidden(err.Error()))
	case errors.Is(err, domain.ErrAlreadyOnWaitlist),
		errors.Is(err, domain.ErrSeatsAvailable),
		errors.Is(err, domain.ErrTooManyActiveEntries):
		response.Error(w, apperrors.NewConflict(err.Error()))
	case errors.Is(err, domain.ErrInvalidSeats):
		response.Error(w, apperrors.NewValidation(err.Error()))
	default:
		response.Error(w, err)
	}
}
