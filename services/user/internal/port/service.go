package port

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/busexpress/services/user/internal/domain"
)

// TokenPair holds the access and refresh tokens returned after authentication.
type TokenPair struct {
	AccessToken  string
	RefreshToken string
	ExpiresAt    time.Time
}

// Enable2FAResult holds the secret and provisioning URI for TOTP setup.
type Enable2FAResult struct {
	Secret         string
	ProvisioningURI string
}

// UserService defines the business operations for user management.
type UserService interface {
	Register(ctx context.Context, email, password string, phone *string) (domain.User, error)
	Login(ctx context.Context, email, password string) (TokenPair, error)
	RefreshToken(ctx context.Context, refreshToken string) (TokenPair, error)
	GetProfile(ctx context.Context, userID uuid.UUID) (domain.User, error)
	UpdateProfile(ctx context.Context, userID uuid.UUID, phone *string) (domain.User, error)
	Enable2FA(ctx context.Context, userID uuid.UUID) (Enable2FAResult, error)
	Verify2FA(ctx context.Context, userID uuid.UUID, code string) error
	ListSessions(ctx context.Context, userID uuid.UUID) ([]domain.Session, error)
	RevokeSession(ctx context.Context, userID uuid.UUID, sessionID uuid.UUID) error
	DeleteAccount(ctx context.Context, userID uuid.UUID) error
}
