package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/busexpress/services/review/internal/domain"
	"github.com/busexpress/services/review/internal/port"
)

type reviewService struct {
	repo     port.ReviewRepository
	bookings port.BookingClient
	trips    port.TripClient
}

// NewReviewService wires the application service.
func NewReviewService(repo port.ReviewRepository, bookings port.BookingClient, trips port.TripClient) port.ReviewService {
	return &reviewService{repo: repo, bookings: bookings, trips: trips}
}

func (s *reviewService) Create(ctx context.Context, bearerToken string, req port.CreateReviewRequest) (*domain.Review, error) {
	if req.Rating < 1 || req.Rating > 5 {
		return nil, domain.ErrInvalidRating
	}
	booking, err := s.bookings.GetBooking(ctx, bearerToken, req.BookingID)
	if err != nil {
		return nil, fmt.Errorf("load booking: %w", err)
	}
	if booking.UserID != req.UserID {
		return nil, domain.ErrNotOwner
	}
	if booking.Status != "confirmed" && booking.Status != "used" {
		return nil, domain.ErrBookingNotEligible
	}
	opID, err := s.trips.GetTripOperator(ctx, booking.TripID)
	if err != nil {
		return nil, fmt.Errorf("resolve operator: %w", err)
	}
	now := time.Now().UTC()
	r := &domain.Review{
		ID:         uuid.New(),
		UserID:     req.UserID,
		OperatorID: opID,
		BookingID:  req.BookingID,
		Rating:     req.Rating,
		Title:      req.Title,
		Body:       req.Body,
		Status:     domain.StatusPublished,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	if err := s.repo.Create(ctx, r); err != nil {
		return nil, err
	}
	return r, nil
}

func (s *reviewService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Review, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *reviewService) ListByOperator(ctx context.Context, opID uuid.UUID, limit, offset int) ([]domain.Review, int, error) {
	return s.repo.ListByOperator(ctx, opID, limit, offset)
}

func (s *reviewService) ListMine(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Review, int, error) {
	return s.repo.ListByUser(ctx, userID, limit, offset)
}

func (s *reviewService) Aggregate(ctx context.Context, opID uuid.UUID) (*domain.Aggregate, error) {
	return s.repo.Aggregate(ctx, opID)
}

func (s *reviewService) Reply(ctx context.Context, operatorID, reviewID uuid.UUID, reply string) (*domain.Review, error) {
	r, err := s.repo.GetByID(ctx, reviewID)
	if err != nil {
		return nil, err
	}
	if r.OperatorID != operatorID {
		return nil, domain.ErrNotOperatorOfReview
	}
	if err := s.repo.SetReply(ctx, reviewID, reply); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, reviewID)
}
