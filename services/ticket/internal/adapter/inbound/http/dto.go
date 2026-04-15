package http

import (
	"time"

	"github.com/busexpress/services/ticket/internal/domain"
)

// IssueRequest is the body for POST /api/v1/tickets.
type IssueRequest struct {
	BookingID string `json:"booking_id" validate:"required,uuid"`
}

// ValidateRequest is the body for POST /api/v1/tickets/validate.
type ValidateRequest struct {
	QR string `json:"qr" validate:"required"`
}

// TicketResponse is the public representation of a ticket.
type TicketResponse struct {
	ID            string     `json:"id"`
	BookingID     string     `json:"booking_id"`
	UserID        string     `json:"user_id"`
	TripID        string     `json:"trip_id"`
	SeatNumber    string     `json:"seat_number"`
	PassengerName string     `json:"passenger_name"`
	Status        string     `json:"status"`
	QR            string     `json:"qr"`
	IssuedAt      time.Time  `json:"issued_at"`
	UsedAt        *time.Time `json:"used_at,omitempty"`
	ExpiresAt     time.Time  `json:"expires_at"`
}

// IssueResponse contains the tickets issued for a booking.
type IssueResponse struct {
	Tickets []TicketResponse `json:"tickets"`
}

func toTicketResponse(t domain.Ticket) TicketResponse {
	return TicketResponse{
		ID:            t.ID.String(),
		BookingID:     t.BookingID.String(),
		UserID:        t.UserID.String(),
		TripID:        t.TripID.String(),
		SeatNumber:    t.SeatNumber,
		PassengerName: t.PassengerName,
		Status:        string(t.Status),
		QR:            t.QRSignature,
		IssuedAt:      t.IssuedAt,
		UsedAt:        t.UsedAt,
		ExpiresAt:     t.ExpiresAt,
	}
}
