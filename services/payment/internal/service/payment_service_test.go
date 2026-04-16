package service

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/busexpress/services/payment/internal/domain"
	"github.com/busexpress/services/payment/internal/port"
)

// --- Mock Repo ---

type mockPaymentRepo struct {
	mu       sync.Mutex
	payments map[uuid.UUID]*domain.Payment
}

func newMockPaymentRepo() *mockPaymentRepo {
	return &mockPaymentRepo{payments: make(map[uuid.UUID]*domain.Payment)}
}

func (r *mockPaymentRepo) Create(_ context.Context, p *domain.Payment) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	cp := *p
	r.payments[p.ID] = &cp
	return nil
}

func (r *mockPaymentRepo) GetByID(_ context.Context, id uuid.UUID) (*domain.Payment, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	p, ok := r.payments[id]
	if !ok {
		return nil, domain.ErrPaymentNotFound
	}
	cp := *p
	return &cp, nil
}

func (r *mockPaymentRepo) ListByUser(_ context.Context, userID uuid.UUID, _, _ int) ([]domain.Payment, int, error) {
	return nil, 0, nil
}

func (r *mockPaymentRepo) UpdateStatus(_ context.Context, id uuid.UUID, status domain.Status, extRef, failReason *string, completedAt *time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	p, ok := r.payments[id]
	if !ok {
		return domain.ErrPaymentNotFound
	}
	p.Status = status
	if extRef != nil {
		p.ExternalRef = extRef
	}
	if failReason != nil {
		p.FailureReason = failReason
	}
	if completedAt != nil {
		p.CompletedAt = completedAt
	}
	return nil
}

// --- Mock Gateway ---

type mockGateway struct {
	chargeResult *port.GatewayResult
	refundResult *port.GatewayResult
}

func (g *mockGateway) Charge(_ context.Context, _ *domain.Payment, cardToken *string) (*port.GatewayResult, error) {
	if cardToken != nil && *cardToken == "tok_test_decline" {
		return &port.GatewayResult{Status: domain.StatusFailed, FailureReason: "declined"}, nil
	}
	if g.chargeResult != nil {
		return g.chargeResult, nil
	}
	return &port.GatewayResult{Status: domain.StatusSucceeded, ExternalRef: "stripe_mock"}, nil
}

func (g *mockGateway) Refund(_ context.Context, _ *domain.Payment) (*port.GatewayResult, error) {
	if g.refundResult != nil {
		return g.refundResult, nil
	}
	return &port.GatewayResult{Status: domain.StatusRefunded, ExternalRef: "refund_mock"}, nil
}

// --- Mock BookingClient ---

type mockBookingClient struct {
	booking  *port.BookingInfo
	confirmed bool
	cancelled bool
}

func (c *mockBookingClient) GetBooking(_ context.Context, _ string, _ uuid.UUID) (*port.BookingInfo, error) {
	if c.booking == nil {
		return nil, domain.ErrPaymentNotFound
	}
	return c.booking, nil
}

func (c *mockBookingClient) Confirm(_ context.Context, _ string, _ uuid.UUID) error {
	c.confirmed = true
	return nil
}

func (c *mockBookingClient) Cancel(_ context.Context, _ string, _ uuid.UUID) error {
	c.cancelled = true
	return nil
}

// --- Helpers ---

func testBooking(userID uuid.UUID) *port.BookingInfo {
	return &port.BookingInfo{
		ID:              uuid.New(),
		UserID:          userID,
		TotalPriceCents: 50000,
		Currency:        "XOF",
		Status:          "pending_payment",
	}
}

func newTestService(userID uuid.UUID) (*paymentService, *mockBookingClient) {
	bc := &mockBookingClient{booking: testBooking(userID)}
	return &paymentService{
		repo:     newMockPaymentRepo(),
		gateway:  &mockGateway{},
		bookings: bc,
	}, bc
}

// --- Tests ---

func TestInitiate_CardSuccess(t *testing.T) {
	userID := uuid.New()
	svc, bc := newTestService(userID)
	tok := "tok_test_ok"

	ctx := WithBearerToken(context.Background(), "fake-jwt")
	p, err := svc.Initiate(ctx, port.InitiatePaymentRequest{
		UserID:    userID,
		BookingID: bc.booking.ID,
		Method:    domain.MethodCard,
		CardToken: &tok,
	})
	if err != nil {
		t.Fatalf("Initiate: %v", err)
	}
	if p.Status != domain.StatusSucceeded {
		t.Fatalf("expected succeeded, got %s", p.Status)
	}
	if !bc.confirmed {
		t.Fatal("booking-service confirm was not called")
	}
}

func TestInitiate_CardDecline(t *testing.T) {
	userID := uuid.New()
	svc, _ := newTestService(userID)
	tok := "tok_test_decline"

	ctx := WithBearerToken(context.Background(), "fake-jwt")
	p, err := svc.Initiate(ctx, port.InitiatePaymentRequest{
		UserID:    userID,
		BookingID: svc.bookings.(*mockBookingClient).booking.ID,
		Method:    domain.MethodCard,
		CardToken: &tok,
	})
	if err != nil {
		t.Fatalf("Initiate: %v", err)
	}
	if p.Status != domain.StatusFailed {
		t.Fatalf("expected failed, got %s", p.Status)
	}
	if p.FailureReason == nil || *p.FailureReason != "declined" {
		t.Fatalf("expected declined reason, got %v", p.FailureReason)
	}
}

func TestInitiate_MobileMoney(t *testing.T) {
	userID := uuid.New()
	svc, _ := newTestService(userID)
	svc.gateway = &mockGateway{
		chargeResult: &port.GatewayResult{Status: domain.StatusProcessing, ExternalRef: "orange_123"},
	}
	msisdn := "+22501020304"

	ctx := WithBearerToken(context.Background(), "fake-jwt")
	p, err := svc.Initiate(ctx, port.InitiatePaymentRequest{
		UserID:    userID,
		BookingID: svc.bookings.(*mockBookingClient).booking.ID,
		Method:    domain.MethodOrangeMoney,
		MSISDN:    &msisdn,
	})
	if err != nil {
		t.Fatal(err)
	}
	if p.Status != domain.StatusProcessing {
		t.Fatalf("expected processing, got %s", p.Status)
	}
}

func TestHandleWebhook_Idempotent(t *testing.T) {
	userID := uuid.New()
	svc, _ := newTestService(userID)
	svc.gateway = &mockGateway{
		chargeResult: &port.GatewayResult{Status: domain.StatusProcessing, ExternalRef: "wave_123"},
	}
	msisdn := "+22501020304"

	ctx := WithBearerToken(context.Background(), "fake-jwt")
	p, _ := svc.Initiate(ctx, port.InitiatePaymentRequest{
		UserID:    userID,
		BookingID: svc.bookings.(*mockBookingClient).booking.ID,
		Method:    domain.MethodWave,
		MSISDN:    &msisdn,
	})

	// First webhook
	p1, err := svc.HandleWebhook(ctx, p.ID, true, "wave_txn_1", "")
	if err != nil {
		t.Fatal(err)
	}
	if p1.Status != domain.StatusSucceeded {
		t.Fatalf("expected succeeded, got %s", p1.Status)
	}

	// Replay webhook — should be idempotent (already terminal)
	p2, err := svc.HandleWebhook(ctx, p.ID, true, "wave_txn_2", "")
	if err != nil {
		t.Fatal(err)
	}
	if p2.Status != domain.StatusSucceeded {
		t.Fatalf("expected still succeeded, got %s", p2.Status)
	}
}

func TestCancel_Terminal(t *testing.T) {
	userID := uuid.New()
	svc, _ := newTestService(userID)
	tok := "tok_test_ok"

	ctx := WithBearerToken(context.Background(), "fake-jwt")
	p, _ := svc.Initiate(ctx, port.InitiatePaymentRequest{
		UserID:    userID,
		BookingID: svc.bookings.(*mockBookingClient).booking.ID,
		Method:    domain.MethodCard,
		CardToken: &tok,
	})

	_, err := svc.Cancel(ctx, userID, p.ID)
	if err != domain.ErrAlreadyTerminal {
		t.Fatalf("expected ErrAlreadyTerminal, got %v", err)
	}
}

func TestRefund_Happy(t *testing.T) {
	userID := uuid.New()
	svc, bc := newTestService(userID)
	tok := "tok_test_ok"

	ctx := WithBearerToken(context.Background(), "fake-jwt")
	p, _ := svc.Initiate(ctx, port.InitiatePaymentRequest{
		UserID:    userID,
		BookingID: bc.booking.ID,
		Method:    domain.MethodCard,
		CardToken: &tok,
	})

	refunded, err := svc.Refund(ctx, userID, p.ID, false)
	if err != nil {
		t.Fatalf("Refund: %v", err)
	}
	if refunded.Status != domain.StatusRefunded {
		t.Fatalf("expected refunded, got %s", refunded.Status)
	}
	if !bc.cancelled {
		t.Fatal("booking-service cancel was not called")
	}
}

func TestRefund_NotOwner(t *testing.T) {
	userID := uuid.New()
	svc, bc := newTestService(userID)
	tok := "tok_test_ok"

	ctx := WithBearerToken(context.Background(), "fake-jwt")
	p, _ := svc.Initiate(ctx, port.InitiatePaymentRequest{
		UserID:    userID,
		BookingID: bc.booking.ID,
		Method:    domain.MethodCard,
		CardToken: &tok,
	})

	_, err := svc.Refund(ctx, uuid.New(), p.ID, false)
	if err != domain.ErrNotOwner {
		t.Fatalf("expected ErrNotOwner, got %v", err)
	}
}

func TestInitiate_NotOwner(t *testing.T) {
	userID := uuid.New()
	svc, _ := newTestService(userID)
	tok := "tok_test_ok"

	ctx := WithBearerToken(context.Background(), "fake-jwt")
	_, err := svc.Initiate(ctx, port.InitiatePaymentRequest{
		UserID:    uuid.New(), // different from booking owner
		BookingID: svc.bookings.(*mockBookingClient).booking.ID,
		Method:    domain.MethodCard,
		CardToken: &tok,
	})
	if err != domain.ErrNotOwner {
		t.Fatalf("expected ErrNotOwner, got %v", err)
	}
}
