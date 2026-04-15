package http

import (
	"time"

	"github.com/busexpress/services/payment/internal/domain"
)

// CardInput is the optional card-method payload.
type CardInput struct {
	Number   string `json:"number"    validate:"required,min=12,max=24"`
	ExpMonth int    `json:"exp_month" validate:"required,min=1,max=12"`
	ExpYear  int    `json:"exp_year"  validate:"required,min=2024,max=2099"`
	CVC      string `json:"cvc"       validate:"required,min=3,max=4"`
	Name     string `json:"name"      validate:"required,min=1,max=100"`
}

// InitiatePaymentRequest is the body for POST /api/v1/payments.
type InitiatePaymentRequest struct {
	BookingID string     `json:"booking_id" validate:"required,uuid"`
	Method    string     `json:"method"     validate:"required,oneof=card orange_money wave mtn_momo moov_money"`
	Card      *CardInput `json:"card,omitempty"`
	MSISDN    *string    `json:"msisdn,omitempty" validate:"omitempty,e164"`
}

// WebhookRequest is the body for POST /api/v1/payments/{id}/webhook.
// In the mock implementation, anyone can call it (dev only).
type WebhookRequest struct {
	Success       bool   `json:"success"`
	ExternalRef   string `json:"external_ref,omitempty"`
	FailureReason string `json:"failure_reason,omitempty"`
}

// PaymentResponse is the public representation of a payment.
type PaymentResponse struct {
	ID            string     `json:"id"`
	BookingID     string     `json:"booking_id"`
	UserID        string     `json:"user_id"`
	AmountCents   int        `json:"amount_cents"`
	Currency      string     `json:"currency"`
	Method        string     `json:"method"`
	Status        string     `json:"status"`
	ExternalRef   *string    `json:"external_ref,omitempty"`
	FailureReason *string    `json:"failure_reason,omitempty"`
	MSISDN        *string    `json:"msisdn,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	CompletedAt   *time.Time `json:"completed_at,omitempty"`
}

// ListPaymentsResponse is a paginated payment list.
type ListPaymentsResponse struct {
	Payments []PaymentResponse `json:"payments"`
	Total    int               `json:"total"`
	Limit    int               `json:"limit"`
	Offset   int               `json:"offset"`
}

func toPaymentResponse(p *domain.Payment) PaymentResponse {
	return PaymentResponse{
		ID:            p.ID.String(),
		BookingID:     p.BookingID.String(),
		UserID:        p.UserID.String(),
		AmountCents:   p.AmountCents,
		Currency:      p.Currency,
		Method:        string(p.Method),
		Status:        string(p.Status),
		ExternalRef:   p.ExternalRef,
		FailureReason: p.FailureReason,
		MSISDN:        p.MSISDN,
		CreatedAt:     p.CreatedAt,
		UpdatedAt:     p.UpdatedAt,
		CompletedAt:   p.CompletedAt,
	}
}
