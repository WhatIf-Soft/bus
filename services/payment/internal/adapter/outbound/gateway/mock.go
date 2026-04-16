package gateway

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/busexpress/services/payment/internal/domain"
	"github.com/busexpress/services/payment/internal/port"
)

// MockGateway simulates Stripe and Mobile Money behaviour without external calls.
//
// Card tokens:
//   - `tok_test_ok`       → succeeded
//   - `tok_test_decline`  → failed (card_declined)
//   - anything else       → succeeded (dev-friendly default)
//
// Mobile money methods always return Processing — the operator must confirm
// via the /payments/{id}/webhook endpoint.
type MockGateway struct{}

// NewMockGateway returns a deterministic in-process gateway suitable for dev/tests.
func NewMockGateway() port.PaymentGateway {
	return &MockGateway{}
}

func (g *MockGateway) Charge(_ context.Context, p *domain.Payment, cardToken *string) (*port.GatewayResult, error) {
	if p.Method == domain.MethodCard {
		if cardToken == nil || *cardToken == "" {
			return &port.GatewayResult{
				Status:        domain.StatusFailed,
				FailureReason: "card_token required",
			}, nil
		}
		if *cardToken == "tok_test_decline" {
			return &port.GatewayResult{
				Status:        domain.StatusFailed,
				FailureReason: "card_declined",
			}, nil
		}
		return &port.GatewayResult{
			Status:      domain.StatusSucceeded,
			ExternalRef: fmt.Sprintf("stripe_%s", uuid.New().String()),
		}, nil
	}

	if p.Method.IsMobileMoney() {
		if p.MSISDN == nil || *p.MSISDN == "" {
			return &port.GatewayResult{
				Status:        domain.StatusFailed,
				FailureReason: "msisdn required",
			}, nil
		}
		return &port.GatewayResult{
			Status:      domain.StatusProcessing,
			ExternalRef: fmt.Sprintf("%s_%s", p.Method, uuid.New().String()),
		}, nil
	}

	return &port.GatewayResult{
		Status:        domain.StatusFailed,
		FailureReason: "unsupported method",
	}, nil
}

// Refund simulates a provider refund — always succeeds in dev.
func (g *MockGateway) Refund(_ context.Context, _ *domain.Payment) (*port.GatewayResult, error) {
	return &port.GatewayResult{
		Status:      domain.StatusRefunded,
		ExternalRef: fmt.Sprintf("refund_%s", uuid.New().String()),
	}, nil
}
