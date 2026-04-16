package http

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/busexpress/pkg/auth"
	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
)

// PasswordResetHandler manages password-reset and email-verification flows.
type PasswordResetHandler struct {
	pool    *pgxpool.Pool
	notifURL string // notification-service base URL for sending emails.
}

// NewPasswordResetHandler constructs the handler.
func NewPasswordResetHandler(pool *pgxpool.Pool, notifURL string) *PasswordResetHandler {
	return &PasswordResetHandler{pool: pool, notifURL: notifURL}
}

func randomToken() (raw string, hash string) {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	raw = hex.EncodeToString(b)
	h := sha256.Sum256([]byte(raw))
	hash = hex.EncodeToString(h[:])
	return
}

// RequestReset handles POST /api/v1/users/password/reset-request.
// Sends a reset token to the user's email (via notification-service).
func (h *PasswordResetHandler) RequestReset(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		response.Error(w, apperrors.NewValidation("email required"))
		return
	}
	ctx := r.Context()

	var userID uuid.UUID
	err := h.pool.QueryRow(ctx,
		"SELECT id FROM users WHERE email = $1 AND status = 'active'", req.Email,
	).Scan(&userID)
	if err != nil {
		// Don't leak whether the email exists.
		response.JSON(w, http.StatusOK, map[string]string{
			"status": "if the email exists, a reset link has been sent",
		})
		return
	}

	rawToken, tokenHash := randomToken()
	expires := time.Now().UTC().Add(1 * time.Hour)
	_, _ = h.pool.Exec(ctx, `
		INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)`, userID, tokenHash, expires,
	)

	// Best-effort email.
	go sendEmail(h.notifURL, req.Email,
		"Réinitialisation de mot de passe — BusExpress",
		fmt.Sprintf("Votre code de réinitialisation : %s\nValide 1 heure.\nIgnorez ce message si vous n'avez pas fait cette demande.", rawToken),
	)

	response.JSON(w, http.StatusOK, map[string]string{
		"status": "if the email exists, a reset link has been sent",
	})
}

// ConfirmReset handles POST /api/v1/users/password/reset-confirm.
func (h *PasswordResetHandler) ConfirmReset(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Token == "" || req.NewPassword == "" {
		response.Error(w, apperrors.NewValidation("token and new_password required"))
		return
	}
	if len(req.NewPassword) < 8 {
		response.Error(w, apperrors.NewValidation("password must be at least 8 characters"))
		return
	}

	tokenHash := sha256.Sum256([]byte(req.Token))
	hashStr := hex.EncodeToString(tokenHash[:])
	ctx := r.Context()

	var tokenID, userID uuid.UUID
	err := h.pool.QueryRow(ctx, `
		SELECT id, user_id FROM password_reset_tokens
		WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`, hashStr,
	).Scan(&tokenID, &userID)
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid or expired token"))
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 12)
	if err != nil {
		response.Error(w, fmt.Errorf("hash password: %w", err))
		return
	}

	_, _ = h.pool.Exec(ctx,
		"UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", string(hash), userID)
	_, _ = h.pool.Exec(ctx,
		"UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1", tokenID)
	// Revoke all sessions on password change.
	_, _ = h.pool.Exec(ctx,
		"UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL", userID)

	response.JSON(w, http.StatusOK, map[string]string{"status": "password_updated"})
}

// RequestVerification handles POST /api/v1/users/me/verify-email.
func (h *PasswordResetHandler) RequestVerification(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.ClaimsFromContext(r.Context())
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	userID, _ := uuid.Parse(claims.UserID)
	ctx := r.Context()

	var email string
	err = h.pool.QueryRow(ctx, "SELECT email FROM users WHERE id = $1", userID).Scan(&email)
	if err != nil {
		response.Error(w, err)
		return
	}

	rawToken, tokenHash := randomToken()
	expires := time.Now().UTC().Add(24 * time.Hour)
	_, _ = h.pool.Exec(ctx, `
		INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)`, userID, tokenHash, expires)

	go sendEmail(h.notifURL, email,
		"Vérification email — BusExpress",
		fmt.Sprintf("Votre code de vérification : %s\nValide 24 heures.", rawToken),
	)

	response.JSON(w, http.StatusOK, map[string]string{"status": "verification_email_sent"})
}

// ConfirmVerification handles POST /api/v1/users/me/verify-email/confirm.
func (h *PasswordResetHandler) ConfirmVerification(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.ClaimsFromContext(r.Context())
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	userID, _ := uuid.Parse(claims.UserID)

	var req struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Token == "" {
		response.Error(w, apperrors.NewValidation("token required"))
		return
	}

	tokenHash := sha256.Sum256([]byte(req.Token))
	hashStr := hex.EncodeToString(tokenHash[:])
	ctx := r.Context()

	var tokenID uuid.UUID
	err = h.pool.QueryRow(ctx, `
		SELECT id FROM email_verification_tokens
		WHERE user_id = $1 AND token_hash = $2 AND verified_at IS NULL AND expires_at > NOW()`,
		userID, hashStr,
	).Scan(&tokenID)
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid or expired verification token"))
		return
	}

	_, _ = h.pool.Exec(ctx,
		"UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1", userID)
	_, _ = h.pool.Exec(ctx,
		"UPDATE email_verification_tokens SET verified_at = NOW() WHERE id = $1", tokenID)

	response.JSON(w, http.StatusOK, map[string]string{"status": "email_verified"})
}

func sendEmail(notifURL, to, subject, body string) {
	payload := fmt.Sprintf(`{"to":%q,"subject":%q,"body":%q}`, to, subject, body)
	req, err := http.NewRequest(http.MethodPost, notifURL+"/api/v1/notifications/email",
		bytes.NewReader([]byte(payload)))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return
	}
	_ = resp.Body.Close()
}
