package bookingclient

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"

	"github.com/busexpress/services/payment/internal/port"
)

type httpClient struct {
	baseURL string
	http    *http.Client
}

// New builds a BookingClient that calls the booking-service HTTP API.
func New(baseURL string) port.BookingClient {
	return &httpClient{
		baseURL: baseURL,
		http:    &http.Client{Timeout: 5 * time.Second},
	}
}

type bookingResponse struct {
	Success bool `json:"success"`
	Data    struct {
		ID              string `json:"id"`
		UserID          string `json:"user_id"`
		TotalPriceCents int    `json:"total_price_cents"`
		Currency        string `json:"currency"`
		Status          string `json:"status"`
	} `json:"data"`
	Error *struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

func (c *httpClient) GetBooking(ctx context.Context, token string, id uuid.UUID) (*port.BookingInfo, error) {
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

	var body bookingResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, fmt.Errorf("decode booking: %w", err)
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
		return nil, fmt.Errorf("parse booking id: %w", err)
	}
	uid, err := uuid.Parse(body.Data.UserID)
	if err != nil {
		return nil, fmt.Errorf("parse booking user id: %w", err)
	}
	return &port.BookingInfo{
		ID:              bid,
		UserID:          uid,
		TotalPriceCents: body.Data.TotalPriceCents,
		Currency:        body.Data.Currency,
		Status:          body.Data.Status,
	}, nil
}

func (c *httpClient) Confirm(ctx context.Context, token string, id uuid.UUID) error {
	return c.post(ctx, token, fmt.Sprintf("/api/v1/bookings/%s/confirm", id))
}

func (c *httpClient) Cancel(ctx context.Context, token string, id uuid.UUID) error {
	return c.post(ctx, token, fmt.Sprintf("/api/v1/bookings/%s/cancel", id))
}

func (c *httpClient) post(ctx context.Context, token, path string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("call booking-service: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("booking-service %s status %d", path, resp.StatusCode)
	}
	return nil
}
