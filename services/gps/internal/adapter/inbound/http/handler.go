package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
	"github.com/busexpress/pkg/validation"

	"github.com/busexpress/services/gps/internal/domain"
	"github.com/busexpress/services/gps/internal/port"
)

// Handler exposes GPS-service endpoints.
type Handler struct {
	service port.GPSService
}

// NewHandler builds a Handler.
func NewHandler(svc port.GPSService) *Handler { return &Handler{service: svc} }

// StartRequest body for POST /api/v1/gps/tracking.
type StartRequest struct {
	TripID   string  `json:"trip_id"    validate:"required,uuid"`
	BusID    *string `json:"bus_id,omitempty"    validate:"omitempty,uuid"`
	DriverID *string `json:"driver_id,omitempty" validate:"omitempty,uuid"`
}

// PositionRequest body for POST /api/v1/gps/position.
type PositionRequest struct {
	TripID   string  `json:"trip_id"    validate:"required,uuid"`
	Lat      float64 `json:"lat"        validate:"required,latitude"`
	Lng      float64 `json:"lng"        validate:"required,longitude"`
	SpeedKmh float64 `json:"speed_kmh"`
}

// PositionResponse is the public view of a tracking session.
type PositionResponse struct {
	TripID        string     `json:"trip_id"`
	Status        string     `json:"status"`
	Lat           *float64   `json:"lat,omitempty"`
	Lng           *float64   `json:"lng,omitempty"`
	SpeedKmh      *float64   `json:"speed_kmh,omitempty"`
	LastUpdatedAt *time.Time `json:"last_updated_at,omitempty"`
}

func toResponse(t *domain.TripTracking) PositionResponse {
	return PositionResponse{
		TripID:        t.TripID.String(),
		Status:        string(t.Status),
		Lat:           t.LastLat,
		Lng:           t.LastLng,
		SpeedKmh:      t.LastSpeedKmh,
		LastUpdatedAt: t.LastUpdatedAt,
	}
}

// Start handles POST /api/v1/gps/tracking.
func (h *Handler) Start(w http.ResponseWriter, r *http.Request) {
	var req StartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	tripID, _ := uuid.Parse(req.TripID)
	var busID, driverID *uuid.UUID
	if req.BusID != nil {
		b, _ := uuid.Parse(*req.BusID)
		busID = &b
	}
	if req.DriverID != nil {
		d, _ := uuid.Parse(*req.DriverID)
		driverID = &d
	}
	t, err := h.service.StartTracking(r.Context(), tripID, busID, driverID)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, toResponse(t))
}

// UpdatePosition handles POST /api/v1/gps/position.
func (h *Handler) UpdatePosition(w http.ResponseWriter, r *http.Request) {
	var req PositionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	tripID, _ := uuid.Parse(req.TripID)
	err := h.service.UpdatePosition(r.Context(), domain.PositionUpdate{
		TripID:   tripID,
		Lat:      req.Lat,
		Lng:      req.Lng,
		SpeedKmh: req.SpeedKmh,
		Time:     time.Now().UTC(),
	})
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// GetPosition handles GET /api/v1/gps/trips/{tripId}/position.
func (h *Handler) GetPosition(w http.ResponseWriter, r *http.Request) {
	tripID, err := uuid.Parse(chi.URLParam(r, "tripId"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid trip_id"))
		return
	}
	t, err := h.service.GetPosition(r.Context(), tripID)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toResponse(t))
}

// Complete handles POST /api/v1/gps/trips/{tripId}/complete.
func (h *Handler) Complete(w http.ResponseWriter, r *http.Request) {
	tripID, err := uuid.Parse(chi.URLParam(r, "tripId"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid trip_id"))
		return
	}
	if err := h.service.Complete(r.Context(), tripID); err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": "completed"})
}

func mapError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrTrackingNotFound):
		response.Error(w, apperrors.NewNotFound(err.Error()))
	case errors.Is(err, domain.ErrNotActive):
		response.Error(w, apperrors.NewConflict(err.Error()))
	default:
		response.Error(w, err)
	}
}
