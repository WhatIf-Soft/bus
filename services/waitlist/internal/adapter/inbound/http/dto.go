package http

import (
	"time"

	"github.com/busexpress/services/waitlist/internal/domain"
)

// JoinRequest is the body for POST /api/v1/waitlist.
type JoinRequest struct {
	TripID         string `json:"trip_id"         validate:"required,uuid"`
	SeatsRequested int    `json:"seats_requested" validate:"required,min=1,max=9"`
}

// EntryResponse is the public representation of a waitlist entry.
type EntryResponse struct {
	ID                  string     `json:"id"`
	UserID              string     `json:"user_id"`
	TripID              string     `json:"trip_id"`
	SeatsRequested      int        `json:"seats_requested"`
	Status              string     `json:"status"`
	NotifiedAt          *time.Time `json:"notified_at,omitempty"`
	ConfirmDeadline     *time.Time `json:"confirm_deadline,omitempty"`
	FulfilledBookingID  *string    `json:"fulfilled_booking_id,omitempty"`
	CancelledAt         *time.Time `json:"cancelled_at,omitempty"`
	CreatedAt           time.Time  `json:"created_at"`
}

// ListEntriesResponse is a paginated list of waitlist entries.
type ListEntriesResponse struct {
	Entries []EntryResponse `json:"entries"`
	Total   int             `json:"total"`
	Limit   int             `json:"limit"`
	Offset  int             `json:"offset"`
}

func toEntryResponse(e *domain.Entry) EntryResponse {
	var booking *string
	if e.FulfilledBookingID != nil {
		s := e.FulfilledBookingID.String()
		booking = &s
	}
	return EntryResponse{
		ID:                  e.ID.String(),
		UserID:              e.UserID.String(),
		TripID:              e.TripID.String(),
		SeatsRequested:      e.SeatsRequested,
		Status:              string(e.Status),
		NotifiedAt:          e.NotifiedAt,
		ConfirmDeadline:     e.ConfirmDeadline,
		FulfilledBookingID:  booking,
		CancelledAt:         e.CancelledAt,
		CreatedAt:           e.CreatedAt,
	}
}
