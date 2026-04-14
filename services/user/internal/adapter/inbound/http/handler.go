package http

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/busexpress/pkg/response"
	"github.com/busexpress/pkg/validation"
	"github.com/busexpress/services/user/internal/domain"
	"github.com/busexpress/services/user/internal/port"
)

// Handler holds HTTP handlers for user-service endpoints.
type Handler struct {
	service port.UserService
}

// NewHandler creates a Handler backed by the given UserService.
func NewHandler(svc port.UserService) *Handler {
	return &Handler{service: svc}
}

// Register handles POST /api/v1/users/register.
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, domain.ErrInvalidCredentials)
		return
	}

	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}

	user, err := h.service.Register(r.Context(), req.Email, req.Password, req.Phone)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.JSON(w, http.StatusCreated, toProfileResponse(user))
}

// Login handles POST /api/v1/users/login.
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, domain.ErrInvalidCredentials)
		return
	}

	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}

	tokens, err := h.service.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.JSON(w, http.StatusOK, LoginResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresAt:    tokens.ExpiresAt,
	})
}

// RefreshToken handles POST /api/v1/users/refresh.
func (h *Handler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, domain.ErrInvalidCredentials)
		return
	}

	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}

	tokens, err := h.service.RefreshToken(r.Context(), req.RefreshToken)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.JSON(w, http.StatusOK, LoginResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresAt:    tokens.ExpiresAt,
	})
}

// GetProfile handles GET /api/v1/users/me.
func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, err := extractUserID(r)
	if err != nil {
		response.Error(w, err)
		return
	}

	user, err := h.service.GetProfile(r.Context(), userID)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.JSON(w, http.StatusOK, toProfileResponse(user))
}

// UpdateProfile handles PUT /api/v1/users/me.
func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, err := extractUserID(r)
	if err != nil {
		response.Error(w, err)
		return
	}

	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, domain.ErrInvalidCredentials)
		return
	}

	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}

	user, err := h.service.UpdateProfile(r.Context(), userID, req.Phone)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.JSON(w, http.StatusOK, toProfileResponse(user))
}

// Enable2FA handles POST /api/v1/users/me/2fa/enable.
func (h *Handler) Enable2FA(w http.ResponseWriter, r *http.Request) {
	userID, err := extractUserID(r)
	if err != nil {
		response.Error(w, err)
		return
	}

	result, err := h.service.Enable2FA(r.Context(), userID)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.JSON(w, http.StatusOK, Enable2FAResponse{
		Secret:         result.Secret,
		ProvisioningURI: result.ProvisioningURI,
	})
}

// Verify2FA handles POST /api/v1/users/me/2fa/verify.
func (h *Handler) Verify2FA(w http.ResponseWriter, r *http.Request) {
	userID, err := extractUserID(r)
	if err != nil {
		response.Error(w, err)
		return
	}

	var req Verify2FARequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, domain.ErrInvalidCredentials)
		return
	}

	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}

	if err := h.service.Verify2FA(r.Context(), userID, req.Code); err != nil {
		response.Error(w, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"status": "2fa_enabled"})
}

// ListSessions handles GET /api/v1/users/me/sessions.
func (h *Handler) ListSessions(w http.ResponseWriter, r *http.Request) {
	userID, err := extractUserID(r)
	if err != nil {
		response.Error(w, err)
		return
	}

	sessions, err := h.service.ListSessions(r.Context(), userID)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.JSON(w, http.StatusOK, sessions)
}

// RevokeSession handles DELETE /api/v1/users/me/sessions/{id}.
func (h *Handler) RevokeSession(w http.ResponseWriter, r *http.Request) {
	userID, err := extractUserID(r)
	if err != nil {
		response.Error(w, err)
		return
	}

	sessionIDStr := chi.URLParam(r, "id")
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		response.Error(w, domain.ErrInvalidCredentials)
		return
	}

	if err := h.service.RevokeSession(r.Context(), userID, sessionID); err != nil {
		response.Error(w, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"status": "revoked"})
}

// DeleteAccount handles DELETE /api/v1/users/me.
func (h *Handler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	userID, err := extractUserID(r)
	if err != nil {
		response.Error(w, err)
		return
	}

	if err := h.service.DeleteAccount(r.Context(), userID); err != nil {
		response.Error(w, err)
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// extractUserID reads the authenticated user's ID from the request context.
// In production this is set by the auth middleware; here we use a placeholder key.
func extractUserID(r *http.Request) (uuid.UUID, error) {
	// TODO: Extract from JWT claims set by auth middleware.
	id, ok := r.Context().Value("user_id").(string)
	if !ok {
		return uuid.Nil, domain.ErrInvalidCredentials
	}
	return uuid.Parse(id)
}

func toProfileResponse(u domain.User) ProfileResponse {
	return ProfileResponse{
		ID:               u.ID.String(),
		Email:            u.Email,
		Phone:            u.Phone,
		Role:             string(u.Role),
		TwoFactorEnabled: u.TwoFactorEnabled,
		CreatedAt:        u.CreatedAt,
	}
}
