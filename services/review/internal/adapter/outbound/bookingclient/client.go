package bookingclient

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"

	"github.com/busexpress/services/review/internal/port"
)

type client struct {
	baseURL string
	http    *http.Client
}

// New constructs a BookingClient.
func New(baseURL string) port.BookingClient {
	return &client{baseURL: baseURL, http: &http.Client{Timeout: 5 * time.Second}}
}

type bookingJSON struct {
	Success bool `json:"success"`
	Data    struct {
		ID     string `json:"id"`
		UserID string `json:"user_id"`
		TripID string `json:"trip_id"`
		Status string `json:"status"`
	} `json:"data"`
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
		return nil, fmt.Errorf("booking-service: empty response")
	}
	bid, _ := uuid.Parse(body.Data.ID)
	uid, _ := uuid.Parse(body.Data.UserID)
	tid, _ := uuid.Parse(body.Data.TripID)
	return &port.BookingInfo{
		ID: bid, UserID: uid, TripID: tid, Status: body.Data.Status,
	}, nil
}
