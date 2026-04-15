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

	"github.com/busexpress/services/support/internal/domain"
	"github.com/busexpress/services/support/internal/port"
)

// Handler exposes support-service endpoints.
type Handler struct {
	service port.SupportService
}

// NewHandler builds a Handler.
func NewHandler(svc port.SupportService) *Handler { return &Handler{service: svc} }

func userFromCtx(r *http.Request) (uuid.UUID, string, error) {
	claims, err := auth.ClaimsFromContext(r.Context())
	if err != nil {
		return uuid.Nil, "", err
	}
	id, err := uuid.Parse(claims.UserID)
	return id, strings.ToLower(claims.Role), err
}

func isAgent(role string) bool {
	return role == "agent_support" || role == "admin"
}

// Create handles POST /api/v1/support/tickets.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	var req CreateTicketRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	var bookingID *uuid.UUID
	if req.BookingID != nil && *req.BookingID != "" {
		b, err := uuid.Parse(*req.BookingID)
		if err != nil {
			response.Error(w, apperrors.NewValidation("invalid booking_id"))
			return
		}
		bookingID = &b
	}
	t, err := h.service.Create(r.Context(), port.CreateTicketRequest{
		UserID: userID, Subject: req.Subject, Body: req.Body,
		Category: domain.Category(req.Category), Priority: domain.Priority(req.Priority),
		BookingID: bookingID,
	})
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, toTicketResponse(t))
}

// Get handles GET /api/v1/support/tickets/{id}.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	userID, role, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid ticket id"))
		return
	}
	t, err := h.service.Get(r.Context(), userID, isAgent(role), id)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toTicketResponse(t))
}

// ListMine handles GET /api/v1/support/tickets/mine.
func (h *Handler) ListMine(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	tickets, total, err := h.service.ListMine(r.Context(), userID, limit, offset)
	if err != nil {
		response.Error(w, err)
		return
	}
	out := make([]TicketResponse, 0, len(tickets))
	for i := range tickets {
		out = append(out, toTicketResponse(&tickets[i]))
	}
	response.JSON(w, http.StatusOK, ListTicketsResponse{
		Tickets: out, Total: total, Limit: limit, Offset: offset,
	})
}

// ListOpen handles GET /api/v1/support/tickets (agent-only).
func (h *Handler) ListOpen(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	tickets, total, err := h.service.ListOpen(r.Context(), limit, offset)
	if err != nil {
		response.Error(w, err)
		return
	}
	out := make([]TicketResponse, 0, len(tickets))
	for i := range tickets {
		out = append(out, toTicketResponse(&tickets[i]))
	}
	response.JSON(w, http.StatusOK, ListTicketsResponse{
		Tickets: out, Total: total, Limit: limit, Offset: offset,
	})
}

// PostMessage handles POST /api/v1/support/tickets/{id}/messages.
func (h *Handler) PostMessage(w http.ResponseWriter, r *http.Request) {
	userID, role, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid ticket id"))
		return
	}
	var req PostMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	t, err := h.service.PostMessage(r.Context(), userID, isAgent(role), id, req.Body)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toTicketResponse(t))
}

// PutStatus handles PUT /api/v1/support/tickets/{id}/status.
func (h *Handler) PutStatus(w http.ResponseWriter, r *http.Request) {
	userID, role, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid ticket id"))
		return
	}
	var req UpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	t, err := h.service.UpdateStatus(r.Context(), userID, isAgent(role), id, domain.Status(req.Status))
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toTicketResponse(t))
}

// Assign handles POST /api/v1/support/tickets/{id}/assign — agent claims a ticket.
func (h *Handler) Assign(w http.ResponseWriter, r *http.Request) {
	agentID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid ticket id"))
		return
	}
	t, err := h.service.AssignAgent(r.Context(), id, agentID)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toTicketResponse(t))
}

func mapError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrTicketNotFound):
		response.Error(w, apperrors.NewNotFound(err.Error()))
	case errors.Is(err, domain.ErrNotOwner),
		errors.Is(err, domain.ErrNotAgent):
		response.Error(w, apperrors.NewForbidden(err.Error()))
	case errors.Is(err, domain.ErrTicketClosed),
		errors.Is(err, domain.ErrInvalidStatus):
		response.Error(w, apperrors.NewConflict(err.Error()))
	case errors.Is(err, domain.ErrEmptyMessage):
		response.Error(w, apperrors.NewValidation(err.Error()))
	default:
		response.Error(w, err)
	}
}
