package port

import (
	"context"

	"github.com/busexpress/services/payment/internal/domain"
	"github.com/google/uuid"
)

// InitiatePaymentRequest is the input for starting a new payment attempt.
type InitiatePaymentRequest struct {
	UserID    uuid.UUID
	BookingID uuid.UUID
	Method    domain.Method
	// Card holds card-mode details (mock; never log).
	Card *CardDetails
	// MSISDN holds the mobile-money payer phone (E.164).
	MSISDN *string
}

// CardDetails are the masked card inputs accepted by the mock gateway.
// Real production wiring uses Stripe.js tokens — not raw PANs.
type CardDetails struct {
	Number    string
	ExpMonth  int
	ExpYear   int
	CVC       string
	Name      string
}

// PaymentService is the application API for payments.
type PaymentService interface {
	Initiate(ctx context.Context, req InitiatePaymentRequest) (*domain.Payment, error)
	GetByID(ctx context.Context, userID, paymentID uuid.UUID) (*domain.Payment, error)
	ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Payment, int, error)
	HandleWebhook(ctx context.Context, paymentID uuid.UUID, success bool, externalRef string, failureReason string) (*domain.Payment, error)
	Cancel(ctx context.Context, userID, paymentID uuid.UUID) (*domain.Payment, error)
}
