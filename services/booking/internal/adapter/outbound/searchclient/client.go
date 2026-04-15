package searchclient

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/busexpress/services/booking/internal/domain"
	"github.com/busexpress/services/booking/internal/port"
	"github.com/google/uuid"
)

type client struct {
	baseURL string
	http    *http.Client
}

// NewClient builds a TripClient that calls the search-service over HTTP.
func NewClient(baseURL string) port.TripClient {
	return &client{
		baseURL: baseURL,
		http:    &http.Client{Timeout: 5 * time.Second},
	}
}

type tripResponse struct {
	Success bool `json:"success"`
	Data    struct {
		ID             string `json:"id"`
		PriceCents     int    `json:"price_cents"`
		Currency       string `json:"currency"`
		AvailableSeats int    `json:"available_seats"`
		BusClass       string `json:"bus_class"`
		Operator       struct {
			ID string `json:"id"`
		} `json:"operator"`
	} `json:"data"`
	Error *struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

func (c *client) GetTrip(ctx context.Context, id uuid.UUID) (*domain.Trip, error) {
	url := fmt.Sprintf("%s/api/v1/search/trips/%s", c.baseURL, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
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

	var body tripResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, fmt.Errorf("decode trip: %w", err)
	}
	if !body.Success {
		msg := "unknown"
		if body.Error != nil {
			msg = body.Error.Message
		}
		return nil, errors.New(msg)
	}

	tripID, err := uuid.Parse(body.Data.ID)
	if err != nil {
		return nil, fmt.Errorf("parse trip id: %w", err)
	}
	opID, err := uuid.Parse(body.Data.Operator.ID)
	if err != nil {
		return nil, fmt.Errorf("parse operator id: %w", err)
	}

	return &domain.Trip{
		ID:             tripID,
		OperatorID:     opID,
		PriceCents:     body.Data.PriceCents,
		Currency:       body.Data.Currency,
		AvailableSeats: body.Data.AvailableSeats,
		BusClass:       body.Data.BusClass,
	}, nil
}
