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

	"github.com/busexpress/services/ticket/internal/domain"
	"github.com/busexpress/services/ticket/internal/port"
)

// Handler exposes ticket-service endpoints.
type Handler struct {
	service port.TicketService
}

// NewHandler builds a Handler.
func NewHandler(svc port.TicketService) *Handler {
	return &Handler{service: svc}
}

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

// Issue handles POST /api/v1/tickets.
func (h *Handler) Issue(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	var req IssueRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	bid, err := uuid.Parse(req.BookingID)
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid booking_id"))
		return
	}
	tickets, err := h.service.IssueForBooking(r.Context(), userID, bid, bearerToken(r))
	if err != nil {
		mapError(w, err)
		return
	}
	out := make([]TicketResponse, 0, len(tickets))
	for _, t := range tickets {
		out = append(out, toTicketResponse(t))
	}
	response.JSON(w, http.StatusCreated, IssueResponse{Tickets: out})
}

// ListByBooking handles GET /api/v1/tickets?booking_id={id}.
func (h *Handler) ListByBooking(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	q := r.URL.Query()
	if bidStr := q.Get("booking_id"); bidStr != "" {
		bid, err := uuid.Parse(bidStr)
		if err != nil {
			response.Error(w, apperrors.NewValidation("invalid booking_id"))
			return
		}
		tickets, err := h.service.ListByBooking(r.Context(), userID, bid)
		if err != nil {
			mapError(w, err)
			return
		}
		out := make([]TicketResponse, 0, len(tickets))
		for _, t := range tickets {
			out = append(out, toTicketResponse(t))
		}
		response.JSON(w, http.StatusOK, IssueResponse{Tickets: out})
		return
	}

	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	tickets, _, err := h.service.ListByUser(r.Context(), userID, limit, offset)
	if err != nil {
		response.Error(w, err)
		return
	}
	out := make([]TicketResponse, 0, len(tickets))
	for _, t := range tickets {
		out = append(out, toTicketResponse(t))
	}
	response.JSON(w, http.StatusOK, IssueResponse{Tickets: out})
}

// Get handles GET /api/v1/tickets/{id}.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid ticket id"))
		return
	}
	t, err := h.service.GetByID(r.Context(), userID, id)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toTicketResponse(*t))
}

// PDF handles GET /api/v1/tickets/{id}/pdf.
func (h *Handler) PDF(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid ticket id"))
		return
	}
	pdfBytes, err := h.service.GeneratePDF(r.Context(), userID, id)
	if err != nil {
		mapError(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", `inline; filename="ticket-`+id.String()+`.pdf"`)
	_, _ = w.Write(pdfBytes)
}

// Validate handles POST /api/v1/tickets/validate (controller-only in production;
// open in dev for testing).
func (h *Handler) Validate(w http.ResponseWriter, r *http.Request) {
	var req ValidateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	t, err := h.service.Validate(r.Context(), req.QR)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toTicketResponse(*t))
}

func mapError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrTicketNotFound):
		response.Error(w, apperrors.NewNotFound(err.Error()))
	case errors.Is(err, domain.ErrNotOwner):
		response.Error(w, apperrors.NewForbidden(err.Error()))
	case errors.Is(err, domain.ErrAlreadyUsed),
		errors.Is(err, domain.ErrTicketExpired),
		errors.Is(err, domain.ErrBookingNotConfirmed):
		response.Error(w, apperrors.NewConflict(err.Error()))
	case errors.Is(err, domain.ErrInvalidQRSignature):
		response.Error(w, apperrors.NewValidation(err.Error()))
	default:
		response.Error(w, err)
	}
}
