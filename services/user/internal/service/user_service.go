package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/busexpress/services/user/internal/domain"
	"github.com/busexpress/services/user/internal/port"
)

// userService implements port.UserService with the core user business logic.
type userService struct {
	repo          port.UserRepository
	passengerRepo port.SavedPassengerRepository
}

// NewUserService creates a new UserService backed by the given repositories.
func NewUserService(repo port.UserRepository, passengerRepo port.SavedPassengerRepository) port.UserService {
	return &userService{
		repo:          repo,
		passengerRepo: passengerRepo,
	}
}

func (s *userService) Register(ctx context.Context, email, password string, phone *string) (domain.User, error) {
	// Check if email is already taken.
	_, err := s.repo.FindByEmail(ctx, email)
	if err == nil {
		return domain.User{}, domain.ErrEmailTaken
	}

	// TODO: Hash password with bcrypt cost 12.
	// TODO: Create user via repository.
	// TODO: Publish user-registered event to Kafka.

	return domain.User{}, fmt.Errorf("register: %w", err)
}

func (s *userService) Login(ctx context.Context, email, password string) (port.TokenPair, error) {
	user, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		return port.TokenPair{}, domain.ErrInvalidCredentials
	}

	// TODO: Verify password hash with bcrypt.
	// TODO: Check if 2FA is enabled; return ErrTwoFactorRequired if so.
	// TODO: Generate JWT access + refresh tokens (RS256).
	// TODO: Create session record.

	_ = user
	return port.TokenPair{}, fmt.Errorf("login: not implemented")
}

func (s *userService) RefreshToken(ctx context.Context, refreshToken string) (port.TokenPair, error) {
	// TODO: Validate refresh token.
	// TODO: Rotate refresh token (invalidate old, issue new).
	// TODO: Issue new access token.

	return port.TokenPair{}, fmt.Errorf("refresh token: not implemented")
}

func (s *userService) GetProfile(ctx context.Context, userID uuid.UUID) (domain.User, error) {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return domain.User{}, fmt.Errorf("get profile: %w", err)
	}
	return user, nil
}

func (s *userService) UpdateProfile(ctx context.Context, userID uuid.UUID, phone *string) (domain.User, error) {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return domain.User{}, fmt.Errorf("update profile: %w", err)
	}

	// Create updated copy (immutability).
	updated := user
	if phone != nil {
		updated.Phone = phone
	}

	// TODO: Validate updated fields.

	result, err := s.repo.Update(ctx, updated)
	if err != nil {
		return domain.User{}, fmt.Errorf("update profile: %w", err)
	}

	return result, nil
}

func (s *userService) Enable2FA(ctx context.Context, userID uuid.UUID) (port.Enable2FAResult, error) {
	_, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return port.Enable2FAResult{}, fmt.Errorf("enable 2fa: %w", err)
	}

	// TODO: Generate TOTP secret.
	// TODO: Store secret (encrypted) on user record.
	// TODO: Return secret + provisioning URI for QR code.

	return port.Enable2FAResult{}, fmt.Errorf("enable 2fa: not implemented")
}

func (s *userService) Verify2FA(ctx context.Context, userID uuid.UUID, code string) error {
	_, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("verify 2fa: %w", err)
	}

	// TODO: Validate TOTP code against stored secret.
	// TODO: Mark two_factor_enabled = true on success.

	return fmt.Errorf("verify 2fa: not implemented")
}

func (s *userService) ListSessions(ctx context.Context, userID uuid.UUID) ([]domain.Session, error) {
	sessions, err := s.repo.ListSessions(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list sessions: %w", err)
	}
	return sessions, nil
}

func (s *userService) RevokeSession(ctx context.Context, userID uuid.UUID, sessionID uuid.UUID) error {
	// TODO: Verify the session belongs to the user before revoking.
	if err := s.repo.RevokeSession(ctx, sessionID); err != nil {
		return fmt.Errorf("revoke session: %w", err)
	}
	return nil
}

func (s *userService) DeleteAccount(ctx context.Context, userID uuid.UUID) error {
	// Soft delete: mark status as deleted and revoke all sessions.
	if err := s.repo.RevokeAllSessions(ctx, userID); err != nil {
		return fmt.Errorf("delete account: revoke sessions: %w", err)
	}

	if err := s.repo.Delete(ctx, userID); err != nil {
		return fmt.Errorf("delete account: %w", err)
	}

	// TODO: Publish account-deleted event to Kafka.
	// TODO: Schedule GDPR anonymisation (30 days).

	return nil
}
