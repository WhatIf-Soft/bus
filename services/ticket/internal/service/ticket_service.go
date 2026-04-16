package service

import (
	"bytes"
	"context"
	"fmt"
	"image/png"
	"time"

	"github.com/google/uuid"
	"github.com/jung-kurt/gofpdf"
	qrcode "github.com/skip2/go-qrcode"

	"github.com/busexpress/services/ticket/internal/domain"
	"github.com/busexpress/services/ticket/internal/port"
	"github.com/busexpress/services/ticket/internal/qrsig"
)

// EmailLookup retrieves the recipient's email from the bearer token.
type EmailLookup interface {
	GetEmail(ctx context.Context, bearerToken string) (string, error)
}

type ticketService struct {
	repo     port.TicketRepository
	bookings port.BookingClient
	trips    port.TripClient
	users    EmailLookup
	notifier port.Notifier
	qrSecret []byte
}

// NewTicketService wires the ticket application service.
func NewTicketService(repo port.TicketRepository, bookings port.BookingClient, trips port.TripClient, users EmailLookup, notifier port.Notifier, qrSecret []byte) port.TicketService {
	return &ticketService{
		repo: repo, bookings: bookings, trips: trips, users: users, notifier: notifier, qrSecret: qrSecret,
	}
}

func (s *ticketService) IssueForBooking(ctx context.Context, userID, bookingID uuid.UUID, bearerToken string) ([]domain.Ticket, error) {
	booking, err := s.bookings.GetBooking(ctx, bearerToken, bookingID)
	if err != nil {
		fmt.Printf("[ticket] load booking err: %v\n", err)
		return nil, fmt.Errorf("load booking: %w", err)
	}
	if booking.UserID != userID {
		return nil, domain.ErrNotOwner
	}
	if booking.Status != "confirmed" {
		return nil, domain.ErrBookingNotConfirmed
	}

	existing, err := s.repo.ListByBooking(ctx, bookingID)
	if err != nil {
		return nil, err
	}
	if len(existing) == len(booking.Seats) && len(existing) > 0 {
		return existing, nil // idempotent
	}

	now := time.Now().UTC()
	expiresAt := now.Add(48 * time.Hour) // §7.3 simplified — full rule: from 24h before to 2h after departure

	tickets := make([]domain.Ticket, 0, len(booking.Seats))
	for _, seat := range booking.Seats {
		tid := uuid.New()
		passenger := seat.FirstName + " " + seat.LastName
		payload := qrsig.Payload{
			TicketID:  tid,
			BookingID: booking.ID,
			SeatID:    seat.SeatNumber,
			TripID:    booking.TripID,
			Passenger: passenger,
			ExpiresAt: expiresAt,
		}
		encoded, err := qrsig.Encode(s.qrSecret, payload)
		if err != nil {
			return nil, fmt.Errorf("sign QR: %w", err)
		}
		tickets = append(tickets, domain.Ticket{
			ID:            tid,
			BookingID:     booking.ID,
			UserID:        booking.UserID,
			TripID:        booking.TripID,
			SeatNumber:    seat.SeatNumber,
			PassengerName: passenger,
			Status:        domain.StatusIssued,
			QRSignature:   encoded,
			IssuedAt:      now,
			ExpiresAt:     expiresAt,
		})
	}
	if err := s.repo.CreateBatch(ctx, tickets); err != nil {
		fmt.Printf("[ticket] CreateBatch err: %v\n", err)
		return nil, err
	}

	// Best-effort email notification — failure does not abort issuance.
	if email, err := s.users.GetEmail(ctx, bearerToken); err == nil && email != "" {
		trip, _ := s.trips.GetTrip(ctx, booking.TripID)
		if trip != nil {
			_ = s.notifier.NotifyTicketsIssued(ctx, email, tickets, trip)
		}
	}

	return s.repo.ListByBooking(ctx, bookingID)
}

func (s *ticketService) GetByID(ctx context.Context, userID, ticketID uuid.UUID) (*domain.Ticket, error) {
	t, err := s.repo.GetByID(ctx, ticketID)
	if err != nil {
		return nil, err
	}
	if t.UserID != userID {
		return nil, domain.ErrNotOwner
	}
	return t, nil
}

func (s *ticketService) ListByBooking(ctx context.Context, userID, bookingID uuid.UUID) ([]domain.Ticket, error) {
	tickets, err := s.repo.ListByBooking(ctx, bookingID)
	if err != nil {
		return nil, err
	}
	for _, t := range tickets {
		if t.UserID != userID {
			return nil, domain.ErrNotOwner
		}
	}
	return tickets, nil
}

func (s *ticketService) ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Ticket, int, error) {
	return s.repo.ListByUser(ctx, userID, limit, offset)
}

func (s *ticketService) GeneratePDF(ctx context.Context, userID, ticketID uuid.UUID) ([]byte, error) {
	t, err := s.GetByID(ctx, userID, ticketID)
	if err != nil {
		return nil, err
	}
	trip, _ := s.trips.GetTrip(ctx, t.TripID)
	return renderPDF(t, trip)
}

func (s *ticketService) Validate(ctx context.Context, qrPayload string) (*domain.Ticket, error) {
	payload, err := qrsig.Decode(s.qrSecret, qrPayload)
	if err != nil {
		return nil, domain.ErrInvalidQRSignature
	}
	if time.Now().After(payload.ExpiresAt) {
		return nil, domain.ErrTicketExpired
	}
	t, err := s.repo.GetByID(ctx, payload.TicketID)
	if err != nil {
		return nil, err
	}
	if t.Status != domain.StatusIssued {
		return nil, domain.ErrAlreadyUsed
	}
	if err := s.repo.MarkUsed(ctx, t.ID, time.Now().UTC()); err != nil {
		return nil, err
	}
	used := time.Now().UTC()
	t.Status = domain.StatusUsed
	t.UsedAt = &used
	return t, nil
}

func (s *ticketService) Transfer(ctx context.Context, userID, ticketID uuid.UUID, newPassengerName string) (*domain.Ticket, error) {
	t, err := s.GetByID(ctx, userID, ticketID)
	if err != nil {
		return nil, err
	}
	if t.Status != domain.StatusIssued {
		return nil, domain.ErrAlreadyUsed
	}
	payload := qrsig.Payload{
		TicketID:  t.ID,
		BookingID: t.BookingID,
		SeatID:    t.SeatNumber,
		TripID:    t.TripID,
		Passenger: newPassengerName,
		ExpiresAt: t.ExpiresAt,
	}
	newQR, err := qrsig.Encode(s.qrSecret, payload)
	if err != nil {
		return nil, fmt.Errorf("re-sign QR: %w", err)
	}
	if err := s.repo.UpdateTransfer(ctx, t.ID, newPassengerName, newQR); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, t.ID)
}

func renderPDF(t *domain.Ticket, trip *port.TripInfo) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 22)
	pdf.Cell(0, 14, "BusExpress")
	pdf.Ln(14)
	pdf.SetFont("Arial", "", 11)
	pdf.Cell(0, 6, "Billet officiel — Conservez ce document jusqu'à la fin du voyage.")
	pdf.Ln(12)

	pdf.SetFont("Arial", "B", 14)
	if trip != nil {
		pdf.Cell(0, 8, fmt.Sprintf("%s  →  %s", trip.OriginCity, trip.DestinationCity))
		pdf.Ln(8)
		pdf.SetFont("Arial", "", 11)
		pdf.Cell(0, 6, fmt.Sprintf("Opérateur : %s", trip.OperatorName))
		pdf.Ln(6)
		pdf.Cell(0, 6, fmt.Sprintf("Départ    : %s", trip.DepartureTime))
		pdf.Ln(6)
		pdf.Cell(0, 6, fmt.Sprintf("Arrivée   : %s", trip.ArrivalTime))
		pdf.Ln(10)
	} else {
		pdf.Cell(0, 6, fmt.Sprintf("Trajet : %s", t.TripID))
		pdf.Ln(10)
	}

	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 6, fmt.Sprintf("Passager : %s", t.PassengerName))
	pdf.Ln(6)
	pdf.Cell(0, 6, fmt.Sprintf("Siège    : %s", t.SeatNumber))
	pdf.Ln(6)
	pdf.SetFont("Arial", "", 9)
	pdf.Cell(0, 5, fmt.Sprintf("Réservation : %s", t.BookingID))
	pdf.Ln(5)
	pdf.Cell(0, 5, fmt.Sprintf("Billet      : %s", t.ID))
	pdf.Ln(5)
	pdf.Cell(0, 5, fmt.Sprintf("Valide jusqu'au : %s", t.ExpiresAt.Format(time.RFC3339)))
	pdf.Ln(10)

	qrBytes, err := qrcode.Encode(t.QRSignature, qrcode.Medium, 256)
	if err != nil {
		return nil, fmt.Errorf("qr generate: %w", err)
	}
	if _, err := png.Decode(bytes.NewReader(qrBytes)); err != nil {
		return nil, fmt.Errorf("qr png decode: %w", err)
	}
	pdf.RegisterImageOptionsReader("qr", gofpdf.ImageOptions{ImageType: "png"}, bytes.NewReader(qrBytes))
	pdf.ImageOptions("qr", 80, pdf.GetY(), 50, 50, false, gofpdf.ImageOptions{ImageType: "png"}, 0, "")

	var out bytes.Buffer
	if err := pdf.Output(&out); err != nil {
		return nil, fmt.Errorf("pdf write: %w", err)
	}
	return out.Bytes(), nil
}
