package searchclient

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

// New constructs a TripClient backed by search-service HTTP.
func New(baseURL string) port.TripClient {
	return &client{baseURL: baseURL, http: &http.Client{Timeout: 5 * time.Second}}
}

type tripJSON struct {
	Success bool `json:"success"`
	Data    struct {
		Operator struct {
			ID string `json:"id"`
		} `json:"operator"`
	} `json:"data"`
}

func (c *client) GetTripOperator(ctx context.Context, tripID uuid.UUID) (uuid.UUID, error) {
	url := fmt.Sprintf("%s/api/v1/search/trips/%s", c.baseURL, tripID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return uuid.Nil, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return uuid.Nil, fmt.Errorf("call search-service: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return uuid.Nil, fmt.Errorf("search-service status %d", resp.StatusCode)
	}
	var body tripJSON
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return uuid.Nil, err
	}
	return uuid.Parse(body.Data.Operator.ID)
}
