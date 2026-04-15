package notifclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/busexpress/services/ticket/internal/domain"
	"github.com/busexpress/services/ticket/internal/port"
)

// Client posts ticket notifications to notification-service.
type Client struct {
	baseURL string
	http    *http.Client
}

// New constructs the notification client.
func New(baseURL string) port.Notifier {
	return &Client{baseURL: baseURL, http: &http.Client{Timeout: 5 * time.Second}}
}

type emailRequest struct {
	To       string `json:"to"`
	Subject  string `json:"subject"`
	Body     string `json:"body"`
	HTMLBody string `json:"html_body,omitempty"`
}

func (c *Client) NotifyTicketsIssued(ctx context.Context, recipientEmail string, tickets []domain.Ticket, trip *port.TripInfo) error {
	if recipientEmail == "" {
		return nil
	}
	subject := "Vos billets BusExpress"
	body := fmt.Sprintf("Bonjour,\n\nVos %d billet(s) ont été émis pour le trajet %s → %s avec %s.\nDépart prévu : %s.\n\nBon voyage !\nBusExpress\n",
		len(tickets), trip.OriginCity, trip.DestinationCity, trip.OperatorName, trip.DepartureTime,
	)
	payload := emailRequest{To: recipientEmail, Subject: subject, Body: body}
	buf, _ := json.Marshal(payload)

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
