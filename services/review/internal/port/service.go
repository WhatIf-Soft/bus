package port

import (
	"context"

	"github.com/busexpress/services/review/internal/domain"
	"github.com/google/uuid"
)

// CreateReviewRequest is the input for posting a new review.
type CreateReviewRequest struct {
	UserID    uuid.UUID
	BookingID uuid.UUID
	Rating    int
	Title     *string
	Body      *string
}

// BookingInfo is the data review-service needs from booking-service to validate.
type BookingInfo struct {
	ID     uuid.UUID
	UserID uuid.UUID
	TripID uuid.UUID
	Status string
}

// BookingClient fetches booking-service data using the caller's bearer token.
type BookingClient interface {
	GetBooking(ctx context.Context, bearerToken string, bookingID uuid.UUID) (*BookingInfo, error)
}

// TripClient lets the review-service infer the operator from a trip
// (used as a fallback when booking-service does not expose operator_id).
type TripClient interface {
	GetTripOperator(ctx context.Context, tripID uuid.UUID) (uuid.UUID, error)
}

// ReviewService is the application API for reviews.
type ReviewService interface {
	Create(ctx context.Context, bearerToken string, req CreateReviewRequest) (*domain.Review, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Review, error)
	ListByOperator(ctx context.Context, opID uuid.UUID, limit, offset int) ([]domain.Review, int, error)
	ListMine(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Review, int, error)
	Aggregate(ctx context.Context, opID uuid.UUID) (*domain.Aggregate, error)
	Reply(ctx context.Context, operatorID, reviewID uuid.UUID, reply string) (*domain.Review, error)
}
