package gateway

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"

	"github.com/busexpress/services/payment/internal/domain"
	"github.com/busexpress/services/payment/internal/port"
)

// MockGateway simulates Stripe and Mobile Money behaviour without external calls.
//
//   - Card method: succeeds immediately UNLESS card number is "4000000000000002"
//     (Stripe's "always declined" test card).
//   - Mobile money methods: returns Processing — operator must confirm via webhook.
type MockGateway struct{}

// NewMockGateway returns a deterministic in-process gateway suitable for dev/tests.
func NewMockGateway() port.PaymentGateway {
	return &MockGateway{}
}

func (g *MockGateway) Charge(_ context.Context, p *domain.Payment, card *port.CardDetails) (*port.GatewayResult, error) {
	if p.Method == domain.MethodCard {
		if card == nil {
			return &port.GatewayResult{
				Status:        domain.StatusFailed,
				FailureReason: "card details required",
			}, nil
		}
		number := strings.ReplaceAll(card.Number, " ", "")
		if number == "4000000000000002" {
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

	// Mobile money: pending until webhook arrives.
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
