package userclient

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Client fetches the caller's email from user-service so notifications
// can address the recipient.
type Client struct {
	baseURL string
	http    *http.Client
}

// New constructs a Client.
func New(baseURL string) *Client {
	return &Client{baseURL: baseURL, http: &http.Client{Timeout: 5 * time.Second}}
}

type profileJSON struct {
	Success bool `json:"success"`
	Data    struct {
		Email string `json:"email"`
	} `json:"data"`
}

// GetEmail returns the email of the user identified by the bearer token.
func (c *Client) GetEmail(ctx context.Context, token string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/api/v1/users/me/", nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := c.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("call user-service: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("user-service status %d", resp.StatusCode)
	}
	var body profileJSON
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return "", err
	}
	return body.Data.Email, nil
}
