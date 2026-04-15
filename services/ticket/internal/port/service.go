package port

import (
	"context"

	"github.com/busexpress/services/ticket/internal/domain"
	"github.com/google/uuid"
)

// TicketService is the application API for tickets.
type TicketService interface {
	IssueForBooking(ctx context.Context, userID, bookingID uuid.UUID, bearerToken string) ([]domain.Ticket, error)
	GetByID(ctx context.Context, userID, ticketID uuid.UUID) (*domain.Ticket, error)
	ListByBooking(ctx context.Context, userID, bookingID uuid.UUID) ([]domain.Ticket, error)
	ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Ticket, int, error)
	GeneratePDF(ctx context.Context, userID, ticketID uuid.UUID) ([]byte, error)
	Validate(ctx context.Context, qrPayload string) (*domain.Ticket, error)
}

// BookingInfo is the snapshot needed from booking-service to issue tickets.
type BookingInfo struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	TripID          uuid.UUID
	Status          string
	Seats           []BookingSeatInfo
}

// BookingSeatInfo is one seat assignment on a booking.
type BookingSeatInfo struct {
	SeatNumber string
	FirstName  string
	LastName   string
}

// BookingClient fetches confirmed bookings to issue tickets against.
type BookingClient interface {
	GetBooking(ctx context.Context, bearerToken string, bookingID uuid.UUID) (*BookingInfo, error)
}

// TripInfo is the snapshot needed from search-service for the printed ticket.
type TripInfo struct {
	OriginCity      string
	DestinationCity string
	OperatorName    string
	DepartureTime   string
	ArrivalTime     string
}

// TripClient fetches trip details for the printed ticket.
type TripClient interface {
	GetTrip(ctx context.Context, tripID uuid.UUID) (*TripInfo, error)
}

// Notifier delivers ticket-issued notifications (email, SMS, push).
type Notifier interface {
	NotifyTicketsIssued(ctx context.Context, recipientEmail string, tickets []domain.Ticket, trip *TripInfo) error
}
