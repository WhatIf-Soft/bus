package http

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
)

// TwilioSMSHandler sends SMS via Twilio REST API (CLAUDE.md §8.2).
// In dev, set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.
// When credentials are empty, logs the message instead of sending.
type TwilioSMSHandler struct {
	accountSID string
	authToken  string
	fromNumber string
}

// NewTwilioSMSHandler constructs the handler.
func NewTwilioSMSHandler(sid, token, from string) *TwilioSMSHandler {
	return &TwilioSMSHandler{accountSID: sid, authToken: token, fromNumber: from}
}

// TwilioSMSRequest is the body for POST /api/v1/notifications/sms/twilio.
type TwilioSMSRequest struct {
	To   string `json:"to"`
	Body string `json:"body"`
}

// SendSMS handles POST /api/v1/notifications/sms/twilio.
func (h *TwilioSMSHandler) SendSMS(w http.ResponseWriter, r *http.Request) {
	var req TwilioSMSRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if req.To == "" || req.Body == "" {
		response.Error(w, apperrors.NewValidation("to and body required"))
		return
	}

	if h.accountSID == "" || h.authToken == "" {
		// Dev mode: just log.
		response.JSON(w, http.StatusAccepted, map[string]string{
			"status":   "logged",
			"provider": "twilio-dev",
			"to":       req.To,
			"body":     req.Body,
		})
		return
	}

	// Real Twilio API call.
	twilioURL := fmt.Sprintf(
		"https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json",
		h.accountSID,
	)
	data := url.Values{}
	data.Set("To", req.To)
	data.Set("From", h.fromNumber)
	data.Set("Body", req.Body)

	httpReq, err := http.NewRequestWithContext(r.Context(), http.MethodPost, twilioURL,
		strings.NewReader(data.Encode()))
	if err != nil {
		response.Error(w, err)
		return
	}
	httpReq.SetBasicAuth(h.accountSID, h.authToken)
	httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		response.Error(w, fmt.Errorf("twilio: %w", err))
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		response.Error(w, fmt.Errorf("twilio status %d", resp.StatusCode))
		return
	}

	response.JSON(w, http.StatusAccepted, map[string]string{
		"status":   "sent",
		"provider": "twilio",
		"to":       req.To,
	})
}

// WhatsAppHandler sends WhatsApp messages via Meta Cloud API (CLAUDE.md §8.2).
// Template-based: messages must use pre-approved Meta templates.
type WhatsAppHandler struct {
	phoneNumberID string
	accessToken   string
}

// NewWhatsAppHandler constructs the handler.
func NewWhatsAppHandler(phoneNumberID, accessToken string) *WhatsAppHandler {
	return &WhatsAppHandler{phoneNumberID: phoneNumberID, accessToken: accessToken}
}

// WhatsAppRequest is the body for POST /api/v1/notifications/whatsapp.
type WhatsAppRequest struct {
	To           string `json:"to"`
	TemplateName string `json:"template_name"`
	Language     string `json:"language"`
	Body         string `json:"body"`
}

// Send handles POST /api/v1/notifications/whatsapp.
func (h *WhatsAppHandler) Send(w http.ResponseWriter, r *http.Request) {
	var req WhatsAppRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if req.To == "" {
		response.Error(w, apperrors.NewValidation("to required"))
		return
	}

	if h.phoneNumberID == "" || h.accessToken == "" {
		response.JSON(w, http.StatusAccepted, map[string]string{
			"status":   "logged",
			"provider": "whatsapp-dev",
			"to":       req.To,
			"template": req.TemplateName,
			"body":     req.Body,
		})
		return
	}

	// Real Meta Cloud API call.
	lang := req.Language
	if lang == "" {
		lang = "fr"
	}
	payload := map[string]any{
		"messaging_product": "whatsapp",
		"to":                req.To,
		"type":              "template",
		"template": map[string]any{
			"name":     req.TemplateName,
			"language": map[string]string{"code": lang},
		},
	}
	buf, _ := json.Marshal(payload)
	url := fmt.Sprintf("https://graph.facebook.com/v18.0/%s/messages", h.phoneNumberID)
	httpReq, err := http.NewRequestWithContext(r.Context(), http.MethodPost, url,
		strings.NewReader(string(buf)))
	if err != nil {
		response.Error(w, err)
		return
	}
	httpReq.Header.Set("Authorization", "Bearer "+h.accessToken)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		response.Error(w, fmt.Errorf("whatsapp: %w", err))
		return
	}
	defer resp.Body.Close()

	response.JSON(w, http.StatusAccepted, map[string]string{
		"status":   "sent",
		"provider": "whatsapp",
		"to":       req.To,
	})
}
