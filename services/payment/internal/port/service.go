package port

import (
	"context"

	"github.com/busexpress/services/payment/internal/domain"
	"github.com/google/uuid"
)

// InitiatePaymentRequest is the input for starting a new payment attempt.
// Per CLAUDE.md §3.4 (PCI-DSS SAQ A), raw PAN/CVC must never touch BusExpress
// servers — only an opaque token minted by the gateway (Stripe.js / mobile
// money provider) may traverse this boundary.
type InitiatePaymentRequest struct {
	UserID    uuid.UUID
	BookingID uuid.UUID
	Method    domain.Method
	// CardToken is the provider-minted token for card-method payments.
	// For the dev mock, use `tok_test_ok` for success or `tok_test_decline`
	// for a declined outcome.
	CardToken *string
	// MSISDN holds the mobile-money payer phone (E.164).
	MSISDN *string
}

// PaymentService is the application API for payments.
type PaymentService interface {
	Initiate(ctx context.Context, req InitiatePaymentRequest) (*domain.Payment, error)
	GetByID(ctx context.Context, userID, paymentID uuid.UUID) (*domain.Payment, error)
	ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Payment, int, error)
	HandleWebhook(ctx context.Context, paymentID uuid.UUID, success bool, externalRef string, failureReason string) (*domain.Payment, error)
	Cancel(ctx context.Context, userID, paymentID uuid.UUID) (*domain.Payment, error)
	Refund(ctx context.Context, requesterID, paymentID uuid.UUID, isAdmin bool) (*domain.Payment, error)
}
