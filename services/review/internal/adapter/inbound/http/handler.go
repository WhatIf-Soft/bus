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

	"github.com/busexpress/services/review/internal/domain"
	"github.com/busexpress/services/review/internal/port"
)

// Handler exposes review-service endpoints.
type Handler struct {
	service port.ReviewService
}

// NewHandler builds a Handler.
func NewHandler(svc port.ReviewService) *Handler { return &Handler{service: svc} }

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

// Create handles POST /api/v1/reviews.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	var req CreateReviewRequest
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
	rev, err := h.service.Create(r.Context(), bearerToken(r), port.CreateReviewRequest{
		UserID: userID, BookingID: bid, Rating: req.Rating,
		Title: req.Title, Body: req.Body,
	})
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, toReviewResponse(rev))
}

// ListByOperator handles GET /api/v1/reviews?operator_id=...
func (h *Handler) ListByOperator(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	opIDStr := q.Get("operator_id")
	if opIDStr == "" {
		response.Error(w, apperrors.NewValidation("operator_id required"))
		return
	}
	opID, err := uuid.Parse(opIDStr)
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid operator_id"))
		return
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	reviews, total, err := h.service.ListByOperator(r.Context(), opID, limit, offset)
	if err != nil {
		response.Error(w, err)
		return
	}
	out := make([]ReviewResponse, 0, len(reviews))
	for i := range reviews {
		out = append(out, toReviewResponse(&reviews[i]))
	}
	response.JSON(w, http.StatusOK, ListReviewsResponse{
		Reviews: out, Total: total, Limit: limit, Offset: offset,
	})
}

// ListMine handles GET /api/v1/reviews/mine.
func (h *Handler) ListMine(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	reviews, total, err := h.service.ListMine(r.Context(), userID, limit, offset)
	if err != nil {
		response.Error(w, err)
		return
	}
	out := make([]ReviewResponse, 0, len(reviews))
	for i := range reviews {
		out = append(out, toReviewResponse(&reviews[i]))
	}
	response.JSON(w, http.StatusOK, ListReviewsResponse{
		Reviews: out, Total: total, Limit: limit, Offset: offset,
	})
}

// Aggregate handles GET /api/v1/reviews/aggregate?operator_id=...
func (h *Handler) Aggregate(w http.ResponseWriter, r *http.Request) {
	opIDStr := r.URL.Query().Get("operator_id")
	if opIDStr == "" {
		response.Error(w, apperrors.NewValidation("operator_id required"))
		return
	}
	opID, err := uuid.Parse(opIDStr)
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid operator_id"))
		return
	}
	a, err := h.service.Aggregate(r.Context(), opID)
	if err != nil {
		response.Error(w, err)
		return
	}
	hist := map[string]int{}
	for k, v := range a.Histogram {
		hist[strconv.Itoa(k)] = v
	}
	response.JSON(w, http.StatusOK, AggregateResponse{
		OperatorID: a.OperatorID.String(),
		Average:    a.Average,
		Count:      a.Count,
		Histogram:  hist,
	})
}

// Reply handles POST /api/v1/reviews/{id}/reply (operator-only).
// The operator's profile id is extracted from the bearer token by the
// upstream operator-service via a header. For MVP we trust the JWT user_id
// equals the operator profile owner id (one user → one profile model).
//
// In production this would call operator-service to resolve the profile.
func (h *Handler) Reply(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid review id"))
		return
	}
	opIDStr := r.URL.Query().Get("operator_id")
	if opIDStr == "" {
		response.Error(w, apperrors.NewValidation("operator_id query param required"))
		return
	}
	opID, err := uuid.Parse(opIDStr)
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid operator_id"))
		return
	}
	var req ReplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	rev, err := h.service.Reply(r.Context(), opID, id, req.Reply)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toReviewResponse(rev))
}

func mapError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrReviewNotFound):
		response.Error(w, apperrors.NewNotFound(err.Error()))
	case errors.Is(err, domain.ErrNotOwner),
		errors.Is(err, domain.ErrNotOperatorOfReview):
		response.Error(w, apperrors.NewForbidden(err.Error()))
	case errors.Is(err, domain.ErrAlreadyReviewed),
		errors.Is(err, domain.ErrBookingNotEligible):
		response.Error(w, apperrors.NewConflict(err.Error()))
	case errors.Is(err, domain.ErrInvalidRating):
		response.Error(w, apperrors.NewValidation(err.Error()))
	default:
		response.Error(w, err)
	}
}
