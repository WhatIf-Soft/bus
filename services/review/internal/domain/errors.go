package domain

import "errors"

var (
	ErrReviewNotFound      = errors.New("review not found")
	ErrAlreadyReviewed     = errors.New("a review already exists for this booking")
	ErrNotOwner            = errors.New("review does not belong to user")
	ErrBookingNotEligible  = errors.New("booking is not eligible for review")
	ErrInvalidRating       = errors.New("rating must be between 1 and 5")
	ErrNotOperatorOfReview = errors.New("operator cannot reply to a review they do not own")
)
