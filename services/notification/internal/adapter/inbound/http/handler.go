package http

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/smtp"

	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
)

// EmailRequest is the body for POST /api/v1/notifications/email.
type EmailRequest struct {
	To       string `json:"to"`
	Subject  string `json:"subject"`
	Body     string `json:"body"`
	HTMLBody string `json:"html_body,omitempty"`
}

// SMSRequest is the body for POST /api/v1/notifications/sms.
// In dev, SMS is logged only — no Twilio call.
type SMSRequest struct {
	To   string `json:"to"`
	Body string `json:"body"`
}

// EmailHandler builds an HTTP handler that posts emails via SMTP.
//
// Defaults to MailHog (localhost:1025) for local dev.
func EmailHandler(smtpAddr, fromAddr string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req EmailRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, apperrors.NewValidation("invalid JSON"))
			return
		}
		if req.To == "" || req.Subject == "" {
			response.Error(w, apperrors.NewValidation("`to` and `subject` are required"))
			return
		}
		msg := []byte(fmt.Sprintf(
			"From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n%s",
			fromAddr, req.To, req.Subject, req.Body,
		))
		if err := smtp.SendMail(smtpAddr, nil, fromAddr, []string{req.To}, msg); err != nil {
			response.Error(w, fmt.Errorf("smtp send: %w", err))
			return
		}
		response.JSON(w, http.StatusAccepted, map[string]string{
			"status":     "sent",
			"to":         req.To,
			"subject":    req.Subject,
			"transport":  smtpAddr,
		})
	}
}

// SMSHandler builds a handler that logs SMS payloads (dev-only).
// Production wiring uses Twilio per CLAUDE.md §8.2.
func SMSHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req SMSRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, apperrors.NewValidation("invalid JSON"))
			return
		}
		response.JSON(w, http.StatusAccepted, map[string]string{
			"status": "logged",
			"to":     req.To,
			"body":   req.Body,
		})
	}
}
