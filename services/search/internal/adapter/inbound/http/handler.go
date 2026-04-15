package http

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
	"github.com/busexpress/services/search/internal/domain"
	"github.com/busexpress/services/search/internal/port"
)

// Handler holds HTTP handlers for search-service endpoints.
type Handler struct {
	service port.SearchService
}

// NewHandler constructs a Handler backed by the given SearchService.
func NewHandler(svc port.SearchService) *Handler {
	return &Handler{service: svc}
}

// SearchTrips handles GET /api/v1/search/trips
func (h *Handler) SearchTrips(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	origin := q.Get("origin")
	destination := q.Get("destination")
	dateStr := q.Get("date")

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid date, expected YYYY-MM-DD"))
		return
	}

	passengers, _ := strconv.Atoi(q.Get("passengers"))
	if passengers <= 0 {
		passengers = 1
	}

	criteria := domain.SearchCriteria{
		OriginCity:      origin,
		DestinationCity: destination,
		DepartureDate:   date,
		Passengers:      passengers,
		SortBy:          q.Get("sort"),
		Limit:           parseInt(q.Get("limit"), 20),
		Offset:          parseInt(q.Get("offset"), 0),
	}

	if maxPrice := q.Get("max_price"); maxPrice != "" {
		if v, err := strconv.Atoi(maxPrice); err == nil {
			criteria.MaxPriceCents = &v
		}
	}
	if bc := q.Get("class"); bc != "" {
		criteria.BusClass = &bc
	}

	results, total, err := h.service.SearchTrips(r.Context(), criteria)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidCriteria) {
			response.Error(w, apperrors.NewValidation(err.Error()))
			return
		}
		response.Error(w, err)
		return
	}

	trips := make([]TripResponse, 0, len(results))
	for _, t := range results {
		trips = append(trips, toTripResponse(t))
	}

	response.JSON(w, http.StatusOK, SearchTripsResponse{
		Trips:  trips,
		Total:  total,
		Limit:  criteria.Limit,
		Offset: criteria.Offset,
	})
}

// Autocomplete handles GET /api/v1/search/autocomplete?q=...
func (h *Handler) Autocomplete(w http.ResponseWriter, r *http.Request) {
	prefix := r.URL.Query().Get("q")
	stops, err := h.service.Autocomplete(r.Context(), prefix)
	if err != nil {
		response.Error(w, err)
		return
	}
	suggestions := make([]StopResponse, 0, len(stops))
	for _, s := range stops {
		suggestions = append(suggestions, toStopResponse(s))
	}
	response.JSON(w, http.StatusOK, AutocompleteResponse{Suggestions: suggestions})
}

// GetTrip handles GET /api/v1/search/trips/{id}
func (h *Handler) GetTrip(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid trip id"))
		return
	}
	result, err := h.service.GetTrip(r.Context(), id)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			response.Error(w, apperrors.NewNotFound("trip not found"))
			return
		}
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toTripResponse(*result))
}

func parseInt(s string, fallback int) int {
	if s == "" {
		return fallback
	}
	if v, err := strconv.Atoi(s); err == nil {
		return v
	}
	return fallback
}
