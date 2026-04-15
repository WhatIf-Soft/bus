package searchclient

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"

	"github.com/busexpress/services/waitlist/internal/domain"
	"github.com/busexpress/services/waitlist/internal/port"
)

type client struct {
	baseURL string
	http    *http.Client
}

// New constructs a TripClient backed by search-service.
func New(baseURL string) port.TripClient {
	return &client{baseURL: baseURL, http: &http.Client{Timeout: 5 * time.Second}}
}

type tripJSON struct {
	Success bool `json:"success"`
	Data    struct {
		AvailableSeats int `json:"available_seats"`
	} `json:"data"`
}

func (c *client) GetAvailability(ctx context.Context, tripID uuid.UUID) (*port.TripAvailability, error) {
	url := fmt.Sprintf("%s/api/v1/search/trips/%s", c.baseURL, tripID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call search-service: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return nil, domain.ErrTripNotFound
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("search-service status %d", resp.StatusCode)
	}
	var body tripJSON
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, err
	}
	return &port.TripAvailability{TripID: tripID, AvailableSeats: body.Data.AvailableSeats}, nil
}
