package http

import (
	"time"

	"github.com/busexpress/services/review/internal/domain"
)

// CreateReviewRequest is the body for POST /api/v1/reviews.
type CreateReviewRequest struct {
	BookingID string  `json:"booking_id" validate:"required,uuid"`
	Rating    int     `json:"rating"     validate:"required,min=1,max=5"`
	Title     *string `json:"title,omitempty" validate:"omitempty,max=160"`
	Body      *string `json:"body,omitempty"  validate:"omitempty,max=2000"`
}

// ReplyRequest is the body for POST /api/v1/reviews/{id}/reply.
type ReplyRequest struct {
	Reply string `json:"reply" validate:"required,min=1,max=2000"`
}

// ReviewResponse is the public representation of a review.
type ReviewResponse struct {
	ID                string     `json:"id"`
	UserID            string     `json:"user_id"`
	OperatorID        string     `json:"operator_id"`
	BookingID         string     `json:"booking_id"`
	Rating            int        `json:"rating"`
	Title             *string    `json:"title,omitempty"`
	Body              *string    `json:"body,omitempty"`
	Status            string     `json:"status"`
	OperatorReply     *string    `json:"operator_reply,omitempty"`
	OperatorRepliedAt *time.Time `json:"operator_replied_at,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
}

// ListReviewsResponse is a paginated list of reviews.
type ListReviewsResponse struct {
	Reviews []ReviewResponse `json:"reviews"`
	Total   int              `json:"total"`
	Limit   int              `json:"limit"`
	Offset  int              `json:"offset"`
}

// AggregateResponse summarises ratings for an operator.
type AggregateResponse struct {
	OperatorID string         `json:"operator_id"`
	Average    float64        `json:"average"`
	Count      int            `json:"count"`
	Histogram  map[string]int `json:"histogram"`
}

func toReviewResponse(r *domain.Review) ReviewResponse {
	return ReviewResponse{
		ID:                r.ID.String(),
		UserID:            r.UserID.String(),
		OperatorID:        r.OperatorID.String(),
		BookingID:         r.BookingID.String(),
		Rating:            r.Rating,
		Title:             r.Title,
		Body:              r.Body,
		Status:            string(r.Status),
		OperatorReply:     r.OperatorReply,
		OperatorRepliedAt: r.OperatorRepliedAt,
		CreatedAt:         r.CreatedAt,
	}
}
