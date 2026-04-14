package http

import "time"

// RegisterRequest is the payload for user registration.
type RegisterRequest struct {
	Email    string  `json:"email" validate:"required,email"`
	Password string  `json:"password" validate:"required,min=8"`
	Phone    *string `json:"phone,omitempty" validate:"omitempty,e164"`
}

// LoginRequest is the payload for user authentication.
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse is returned after successful authentication.
type LoginResponse struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
}

// RefreshRequest is the payload for token refresh.
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// ProfileResponse is the public representation of a user profile.
type ProfileResponse struct {
	ID               string    `json:"id"`
	Email            string    `json:"email"`
	Phone            *string   `json:"phone,omitempty"`
	Role             string    `json:"role"`
	TwoFactorEnabled bool      `json:"two_factor_enabled"`
	CreatedAt        time.Time `json:"created_at"`
}

// UpdateProfileRequest is the payload for updating user profile fields.
type UpdateProfileRequest struct {
	Phone       *string `json:"phone,omitempty" validate:"omitempty,e164"`
	Preferences *string `json:"preferences,omitempty"`
}

// Enable2FAResponse is returned when 2FA setup is initiated.
type Enable2FAResponse struct {
	Secret         string `json:"secret"`
	ProvisioningURI string `json:"provisioning_uri"`
}

// Verify2FARequest is the payload for verifying a 2FA code.
type Verify2FARequest struct {
	Code string `json:"code" validate:"required,len=6"`
}
