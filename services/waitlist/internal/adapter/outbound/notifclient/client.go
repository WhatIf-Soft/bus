package notifclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/busexpress/services/waitlist/internal/domain"
	"github.com/busexpress/services/waitlist/internal/port"
)

// Client posts emails to notification-service.
type Client struct {
	baseURL string
	http    *http.Client
}

// New constructs a Notifier.
func New(baseURL string) port.Notifier {
	return &Client{baseURL: baseURL, http: &http.Client{Timeout: 5 * time.Second}}
}

type emailRequest struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func (c *Client) NotifyAvailable(ctx context.Context, recipientEmail string, e *domain.Entry) error {
	if recipientEmail == "" {
		return nil
	}
	subject := "BusExpress — siège disponible"
	deadlineStr := "15 minutes"
	if e.ConfirmDeadline != nil {
		deadlineStr = e.ConfirmDeadline.UTC().Format("15:04 UTC on 2006-01-02")
	}
	body := fmt.Sprintf(
		"Bonjour,\n\nUne place s'est libérée pour le trajet %s.\nVous avez jusqu'à %s pour confirmer votre réservation.\n\nBonne journée,\nBusExpress\n",
		e.TripID, deadlineStr,
	)
	buf, _ := json.Marshal(emailRequest{To: recipientEmail, Subject: subject, Body: body})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/v1/notifications/email", bytes.NewReader(buf))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("call notification-service: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("notification-service status %d", resp.StatusCode)
	}
	return nil
}
