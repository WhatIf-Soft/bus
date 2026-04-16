package http

import (
	"time"

	"github.com/busexpress/services/payment/internal/domain"
)

// InitiatePaymentRequest is the body for POST /api/v1/payments.
// Per CLAUDE.md §3.4, raw card data never reaches the server —
// only a provider-minted token is accepted.
type InitiatePaymentRequest struct {
	BookingID string  `json:"booking_id" validate:"required,uuid"`
	Method    string  `json:"method"     validate:"required,oneof=card orange_money wave mtn_momo moov_money"`
	CardToken *string `json:"card_token,omitempty" validate:"omitempty,min=4,max=200"`
	MSISDN    *string `json:"msisdn,omitempty" validate:"omitempty,e164"`
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
