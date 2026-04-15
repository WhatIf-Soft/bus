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

	"github.com/busexpress/services/payment/internal/domain"
	"github.com/busexpress/services/payment/internal/port"
	"github.com/busexpress/services/payment/internal/service"
)

// Handler exposes payment-service HTTP endpoints.
type Handler struct {
	service port.PaymentService
}

// NewHandler builds a Handler.
func NewHandler(svc port.PaymentService) *Handler {
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

// Initiate handles POST /api/v1/payments.
func (h *Handler) Initiate(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	var req InitiatePaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON body"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}

	bookingID, err := uuid.Parse(req.BookingID)
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid booking_id"))
		return
	}
	method := domain.Method(req.Method)

	if method == domain.MethodCard && req.Card == nil {
		response.Error(w, apperrors.NewValidation("card details required for card method"))
		return
	}
	if method.IsMobileMoney() && (req.MSISDN == nil || *req.MSISDN == "") {
		response.Error(w, apperrors.NewValidation("msisdn required for mobile money"))
		return
	}

	var card *port.CardDetails
	if req.Card != nil {
		card = &port.CardDetails{
			Number:   req.Card.Number,
			ExpMonth: req.Card.ExpMonth,
			ExpYear:  req.Card.ExpYear,
			CVC:      req.Card.CVC,
			Name:     req.Card.Name,
		}
	}

	ctx := service.WithBearerToken(r.Context(), bearerToken(r))

	p, err := h.service.Initiate(ctx, port.InitiatePaymentRequest{
		UserID:    userID,
		BookingID: bookingID,
		Method:    method,
		Card:      card,
		MSISDN:    req.MSISDN,
	})
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, toPaymentResponse(p))
}

// Get handles GET /api/v1/payments/{id}.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid payment id"))
		return
	}
	p, err := h.service.GetByID(r.Context(), userID, id)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toPaymentResponse(p))
}

// List handles GET /api/v1/payments.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	payments, total, err := h.service.ListByUser(r.Context(), userID, limit, offset)
	if err != nil {
		response.Error(w, err)
		return
	}
	out := make([]PaymentResponse, 0, len(payments))
	for i := range payments {
		out = append(out, toPaymentResponse(&payments[i]))
	}
	response.JSON(w, http.StatusOK, ListPaymentsResponse{
		Payments: out, Total: total, Limit: limit, Offset: offset,
	})
}

// Cancel handles POST /api/v1/payments/{id}/cancel.
func (h *Handler) Cancel(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid payment id"))
		return
	}
	p, err := h.service.Cancel(r.Context(), userID, id)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toPaymentResponse(p))
}

// Webhook handles POST /api/v1/payments/{id}/webhook.
// In production this would be signed and verified per provider. For dev, it's open.
// The bearer token is forwarded to booking-service so confirm calls succeed.
func (h *Handler) Webhook(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid payment id"))
		return
	}
	var req WebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON body"))
		return
	}
	ctx := service.WithBearerToken(r.Context(), bearerToken(r))
	p, err := h.service.HandleWebhook(ctx, id, req.Success, req.ExternalRef, req.FailureReason)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toPaymentResponse(p))
}

func mapError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrPaymentNotFound):
		response.Error(w, apperrors.NewNotFound(err.Error()))
	case errors.Is(err, domain.ErrNotOwner):
		response.Error(w, apperrors.NewForbidden(err.Error()))
	case errors.Is(err, domain.ErrAlreadyTerminal),
		errors.Is(err, domain.ErrInvalidStatus):
		response.Error(w, apperrors.NewConflict(err.Error()))
	case errors.Is(err, domain.ErrGatewayDeclined):
		response.Error(w, apperrors.NewValidation(err.Error()))
	default:
		response.Error(w, err)
	}
}
