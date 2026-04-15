package bookingclient

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"

	"github.com/busexpress/services/ticket/internal/port"
)

type client struct {
	baseURL string
	http    *http.Client
}

// New constructs a BookingClient for HTTP calls to booking-service.
func New(baseURL string) port.BookingClient {
	return &client{baseURL: baseURL, http: &http.Client{Timeout: 5 * time.Second}}
}

type seatJSON struct {
	SeatNumber string `json:"seat_number"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
}

type bookingJSON struct {
	Success bool `json:"success"`
	Data    struct {
		ID     string     `json:"id"`
		UserID string     `json:"user_id"`
		TripID string     `json:"trip_id"`
		Status string     `json:"status"`
		Seats  []seatJSON `json:"seats"`
	} `json:"data"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (c *client) GetBooking(ctx context.Context, token string, id uuid.UUID) (*port.BookingInfo, error) {
	url := fmt.Sprintf("%s/api/v1/bookings/%s", c.baseURL, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call booking-service: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("booking %s not found", id)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("booking-service status %d", resp.StatusCode)
	}
	var body bookingJSON
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, err
	}
	if !body.Success {
		msg := "unknown"
		if body.Error != nil {
			msg = body.Error.Message
		}
		return nil, fmt.Errorf("booking-service: %s", msg)
	}
	bid, err := uuid.Parse(body.Data.ID)
	if err != nil {
		return nil, err
	}
	uid, err := uuid.Parse(body.Data.UserID)
	if err != nil {
		return nil, err
	}
	tid, err := uuid.Parse(body.Data.TripID)
	if err != nil {
		return nil, err
	}
	seats := make([]port.BookingSeatInfo, 0, len(body.Data.Seats))
	for _, s := range body.Data.Seats {
		seats = append(seats, port.BookingSeatInfo{
			SeatNumber: s.SeatNumber,
			FirstName:  s.FirstName,
			LastName:   s.LastName,
		})
	}
	return &port.BookingInfo{
		ID:     bid,
		UserID: uid,
		TripID: tid,
		Status: body.Data.Status,
		Seats:  seats,
	}, nil
}
