package port

import (
	"context"

	"github.com/busexpress/services/payment/internal/domain"
)

// GatewayResult is the outcome of a gateway charge attempt.
type GatewayResult struct {
	// Status is one of Succeeded, Processing (async), Failed.
	Status domain.Status
	// ExternalRef is the gateway's transaction id.
	ExternalRef string
	// FailureReason is set when Status is Failed.
	FailureReason string
}

// PaymentGateway abstracts a payment provider (Stripe, Orange Money, etc.).
type PaymentGateway interface {
	Charge(ctx context.Context, p *domain.Payment, card *CardDetails) (*GatewayResult, error)
}
