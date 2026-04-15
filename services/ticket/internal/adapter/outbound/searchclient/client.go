package searchclient

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

// New constructs a TripClient backed by search-service HTTP.
func New(baseURL string) port.TripClient {
	return &client{baseURL: baseURL, http: &http.Client{Timeout: 5 * time.Second}}
}

type tripJSON struct {
	Success bool `json:"success"`
	Data    struct {
		DepartureTime string `json:"departure_time"`
		ArrivalTime   string `json:"arrival_time"`
		Operator      struct {
			Name string `json:"name"`
		} `json:"operator"`
		Origin struct {
			City string `json:"city"`
		} `json:"origin"`
		Destination struct {
			City string `json:"city"`
		} `json:"destination"`
	} `json:"data"`
}

func (c *client) GetTrip(ctx context.Context, id uuid.UUID) (*port.TripInfo, error) {
	url := fmt.Sprintf("%s/api/v1/search/trips/%s", c.baseURL, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call search-service: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("search-service status %d", resp.StatusCode)
	}
	var body tripJSON
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, err
	}
	return &port.TripInfo{
		OriginCity:      body.Data.Origin.City,
		DestinationCity: body.Data.Destination.City,
		OperatorName:    body.Data.Operator.Name,
		DepartureTime:   body.Data.DepartureTime,
		ArrivalTime:     body.Data.ArrivalTime,
	}, nil
}
