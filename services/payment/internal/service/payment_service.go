package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/busexpress/services/payment/internal/domain"
	"github.com/busexpress/services/payment/internal/port"
)

// tokenContextKey is the unexported key used to inject the caller's bearer token
// into the context so downstream HTTP calls (booking-service confirm) can authenticate.
type tokenContextKey struct{}

// WithBearerToken returns a context carrying the caller's bearer token.
func WithBearerToken(ctx context.Context, token string) context.Context {
	return context.WithValue(ctx, tokenContextKey{}, token)
}

// BearerTokenFromContext extracts the caller's bearer token, if any.
func BearerTokenFromContext(ctx context.Context) string {
	if v, ok := ctx.Value(tokenContextKey{}).(string); ok {
		return v
	}
	return ""
}

type paymentService struct {
	repo     port.PaymentRepository
	gateway  port.PaymentGateway
	bookings port.BookingClient
}

// NewPaymentService wires the payment application service.
func NewPaymentService(repo port.PaymentRepository, gw port.PaymentGateway, bookings port.BookingClient) port.PaymentService {
	return &paymentService{repo: repo, gateway: gw, bookings: bookings}
}

func (s *paymentService) Initiate(ctx context.Context, req port.InitiatePaymentRequest) (*domain.Payment, error) {
	token := BearerTokenFromContext(ctx)
	if token == "" {
		return nil, domain.ErrNotOwner
	}

	booking, err := s.bookings.GetBooking(ctx, token, req.BookingID)
	if err != nil {
		return nil, fmt.Errorf("load booking: %w", err)
	}
	if booking.UserID != req.UserID {
		return nil, domain.ErrNotOwner
	}
	if booking.Status != "pending_payment" && booking.Status != "pending_seat" {
		return nil, fmt.Errorf("%w: booking is %s", domain.ErrInvalidStatus, booking.Status)
	}

	now := time.Now().UTC()
	p := &domain.Payment{
		ID:          uuid.New(),
		BookingID:   booking.ID,
		UserID:      req.UserID,
		AmountCents: booking.TotalPriceCents,
		Currency:    booking.Currency,
		Method:      req.Method,
		Status:      domain.StatusPending,
		MSISDN:      req.MSISDN,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := s.repo.Create(ctx, p); err != nil {
		return nil, err
	}

	result, err := s.gateway.Charge(ctx, p, req.Card)
	if err != nil {
		_ = s.repo.UpdateStatus(ctx, p.ID, domain.StatusFailed, nil, ptr(err.Error()), ptrTime(now))
		p.Status = domain.StatusFailed
		reason := err.Error()
		p.FailureReason = &reason
		return p, nil
	}

	completedAt := time.Now().UTC()
	var compPtr *time.Time
	if result.Status.IsTerminal() {
		compPtr = &completedAt
	}
	var extPtr *string
	if result.ExternalRef != "" {
		extPtr = &result.ExternalRef
	}
	var failPtr *string
	if result.FailureReason != "" {
		failPtr = &result.FailureReason
	}
	if err := s.repo.UpdateStatus(ctx, p.ID, result.Status, extPtr, failPtr, compPtr); err != nil {
		return nil, err
	}
	p.Status = result.Status
	p.ExternalRef = extPtr
	p.FailureReason = failPtr
	if compPtr != nil {
		p.CompletedAt = compPtr
	}

	if result.Status == domain.StatusSucceeded {
		if err := s.bookings.Confirm(ctx, token, booking.ID); err != nil {
			return p, fmt.Errorf("payment ok but booking confirm failed: %w", err)
		}
	}
	return p, nil
}

func (s *paymentService) GetByID(ctx context.Context, userID, paymentID uuid.UUID) (*domain.Payment, error) {
	p, err := s.repo.GetByID(ctx, paymentID)
	if err != nil {
		return nil, err
	}
	if p.UserID != userID {
		return nil, domain.ErrNotOwner
	}
	return p, nil
}

func (s *paymentService) ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Payment, int, error) {
	return s.repo.ListByUser(ctx, userID, limit, offset)
}

func (s *paymentService) HandleWebhook(ctx context.Context, paymentID uuid.UUID, success bool, externalRef, failureReason string) (*domain.Payment, error) {
	p, err := s.repo.GetByID(ctx, paymentID)
	if err != nil {
		return nil, err
	}
	if p.Status.IsTerminal() {
		return p, nil
	}

	now := time.Now().UTC()
	newStatus := domain.StatusFailed
	if success {
		newStatus = domain.StatusSucceeded
	}
	var extPtr *string
	if externalRef != "" {
		extPtr = &externalRef
	}
	var failPtr *string
	if !success && failureReason != "" {
		failPtr = &failureReason
	}
	if err := s.repo.UpdateStatus(ctx, p.ID, newStatus, extPtr, failPtr, &now); err != nil {
		return nil, err
	}
	p.Status = newStatus
	p.ExternalRef = extPtr
	p.FailureReason = failPtr
	p.CompletedAt = &now

	if success {
		token := BearerTokenFromContext(ctx)
		if token != "" {
			_ = s.bookings.Confirm(ctx, token, p.BookingID)
		}
	}
	return p, nil
}

func (s *paymentService) Cancel(ctx context.Context, userID, paymentID uuid.UUID) (*domain.Payment, error) {
	p, err := s.repo.GetByID(ctx, paymentID)
	if err != nil {
		return nil, err
	}
	if p.UserID != userID {
		return nil, domain.ErrNotOwner
	}
	if p.Status.IsTerminal() {
		return nil, domain.ErrAlreadyTerminal
	}
	now := time.Now().UTC()
	if err := s.repo.UpdateStatus(ctx, p.ID, domain.StatusCancelled, nil, ptr("user_cancelled"), &now); err != nil {
		return nil, err
	}
	p.Status = domain.StatusCancelled
	p.CompletedAt = &now
	return p, nil
}

func ptr(s string) *string { return &s }

func ptrTime(t time.Time) *time.Time { return &t }
