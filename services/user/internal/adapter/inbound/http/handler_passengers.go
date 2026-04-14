package http

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/busexpress/pkg/response"
	"github.com/busexpress/pkg/validation"
	"github.com/busexpress/services/user/internal/domain"
)

// ListSavedPassengers handles GET /api/v1/users/me/passengers.
func (h *Handler) ListSavedPassengers(w http.ResponseWriter, r *http.Request) {
	userID, err := extractUserID(r)
	if err != nil {
		response.Error(w, err)
		return
	}

	passengers, err := h.service.ListSavedPassengers(r.Context(), userID)
	if err != nil {
		response.Error(w, err)
		return
	}

	out := make([]SavedPassengerResponse, 0, len(passengers))
	for _, p := range passengers {
		out = append(out, toSavedPassengerResponse(p))
	}

	response.JSON(w, http.StatusOK, out)
}

// CreateSavedPassenger handles POST /api/v1/users/me/passengers.
func (h *Handler) CreateSavedPassenger(w http.ResponseWriter, r *http.Request) {
	userID, err := extractUserID(r)
	if err != nil {
		response.Error(w, err)
		return
	}

	var req SavedPassengerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, domain.ErrInvalidCredentials)
		return
	}

	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}

	created, err := h.service.CreateSavedPassenger(
		r.Context(), userID, req.FirstName, req.LastName, req.DateOfBirth, req.DocumentNumber,
	)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.JSON(w, http.StatusCreated, toSavedPassengerResponse(created))
}

// UpdateSavedPassenger handles PUT /api/v1/users/me/passengers/{id}.
func (h *Handler) UpdateSavedPassenger(w http.ResponseWriter, r *http.Request) {
	userID, err := extractUserID(r)
	if err != nil {
		response.Error(w, err)
		return
	}

	passengerID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, domain.ErrInvalidCredentials)
		return
	}

	var req SavedPassengerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, domain.ErrInvalidCredentials)
		return
	}

	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}

	updated, err := h.service.UpdateSavedPassenger(
		r.Context(), userID, passengerID, req.FirstName, req.LastName, req.DateOfBirth, req.DocumentNumber,
	)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.JSON(w, http.StatusOK, toSavedPassengerResponse(updated))
}

// DeleteSavedPassenger handles DELETE /api/v1/users/me/passengers/{id}.
func (h *Handler) DeleteSavedPassenger(w http.ResponseWriter, r *http.Request) {
	userID, err := extractUserID(r)
	if err != nil {
		response.Error(w, err)
		return
	}

	passengerID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, domain.ErrInvalidCredentials)
		return
	}

	if err := h.service.DeleteSavedPassenger(r.Context(), userID, passengerID); err != nil {
		response.Error(w, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func toSavedPassengerResponse(p domain.SavedPassenger) SavedPassengerResponse {
	var docMasked *string
	if p.DocumentNumber != nil && *p.DocumentNumber != "" {
		doc := *p.DocumentNumber
		masked := maskDocument(doc)
		docMasked = &masked
	}
	return SavedPassengerResponse{
		ID:                     p.ID.String(),
		FirstName:              p.FirstName,
		LastName:               p.LastName,
		DateOfBirth:            p.DateOfBirth,
		DocumentNumberMasked:   docMasked,
		CreatedAt:              p.CreatedAt,
	}
}

// maskDocument returns a masked version showing only the last 4 characters.
func maskDocument(doc string) string {
	if len(doc) <= 4 {
		return "****"
	}
	return "****" + doc[len(doc)-4:]
}
