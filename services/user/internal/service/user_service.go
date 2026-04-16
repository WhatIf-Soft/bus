package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
	"golang.org/x/crypto/bcrypt"

	"github.com/busexpress/pkg/auth"
	"github.com/busexpress/services/user/internal/domain"
	"github.com/busexpress/services/user/internal/port"
)

// bcryptCost is the bcrypt hashing cost (OWASP 2024 recommendation).
const bcryptCost = 12

// EventPublisher publishes user lifecycle events. The main.go implementation
// wraps pkg/kafka.Producer; tests can pass a no-op.
type EventPublisher interface {
	PublishUserRegistered(ctx context.Context, userID uuid.UUID, email string) error
	PublishUserLoggedIn(ctx context.Context, userID uuid.UUID) error
	PublishUser2FAEnabled(ctx context.Context, userID uuid.UUID) error
	PublishUserDeleted(ctx context.Context, userID uuid.UUID) error
}

// NoopPublisher is used when events are disabled (tests, local dev).
type NoopPublisher struct{}

func (NoopPublisher) PublishUserRegistered(context.Context, uuid.UUID, string) error {
	return nil
}
func (NoopPublisher) PublishUserLoggedIn(context.Context, uuid.UUID) error    { return nil }
func (NoopPublisher) PublishUser2FAEnabled(context.Context, uuid.UUID) error  { return nil }
func (NoopPublisher) PublishUserDeleted(context.Context, uuid.UUID) error     { return nil }

// Config bundles the service-level dependencies injected from main.go.
type Config struct {
	JWTSecret   []byte
	KeyPair     *auth.KeyPair // EdDSA keypair; if set, takes precedence over JWTSecret (HS256).
	TOTPIssuer  string
	TokensUntilExpiry time.Duration
}

// userService implements port.UserService with the core user business logic.
type userService struct {
	repo          port.UserRepository
	passengerRepo port.SavedPassengerRepository
	publisher     EventPublisher
	cfg           Config
}

// NewUserService creates a new UserService with all required dependencies.
func NewUserService(
	repo port.UserRepository,
	passengerRepo port.SavedPassengerRepository,
	publisher EventPublisher,
	cfg Config,
) port.UserService {
	if publisher == nil {
		publisher = NoopPublisher{}
	}
	if cfg.TOTPIssuer == "" {
		cfg.TOTPIssuer = "BusExpress"
	}
	return &userService{
		repo:          repo,
		passengerRepo: passengerRepo,
		publisher:     publisher,
		cfg:           cfg,
	}
}

// Register creates a new user account with a bcrypt-hashed password.
func (s *userService) Register(ctx context.Context, email, password string, phone *string) (domain.User, error) {
	// Check email availability.
	if _, err := s.repo.FindByEmail(ctx, email); err == nil {
		return domain.User{}, domain.ErrEmailTaken
	} else if !errors.Is(err, domain.ErrUserNotFound) {
		return domain.User{}, fmt.Errorf("register: check email: %w", err)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return domain.User{}, fmt.Errorf("register: hash password: %w", err)
	}

	user := domain.User{
		Email:        email,
		Phone:        phone,
		PasswordHash: string(hash),
		Role:         domain.RoleVoyageur,
		Status:       domain.StatusActive,
	}

	created, err := s.repo.Create(ctx, user)
	if err != nil {
		return domain.User{}, fmt.Errorf("register: create user: %w", err)
	}

	if err := s.publisher.PublishUserRegistered(ctx, created.ID, created.Email); err != nil {
		// Non-fatal: log via publisher implementation, do not fail registration.
		_ = err
	}

	// Never expose the hash.
	created.PasswordHash = ""
	return created, nil
}

// Login authenticates with email and password, returning a token pair
// or ErrTwoFactorRequired if the user has 2FA enabled.
func (s *userService) Login(ctx context.Context, email, password string, meta port.SessionMeta) (port.TokenPair, error) {
	user, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return port.TokenPair{}, domain.ErrInvalidCredentials
		}
		return port.TokenPair{}, fmt.Errorf("login: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return port.TokenPair{}, domain.ErrInvalidCredentials
	}

	if user.Status != domain.StatusActive {
		return port.TokenPair{}, domain.ErrInvalidCredentials
	}

	if user.TwoFactorEnabled {
		return port.TokenPair{}, domain.ErrTwoFactorRequired
	}

	return s.issueTokens(ctx, user, meta)
}

// LoginWith2FA validates password + TOTP code atomically before issuing tokens.
func (s *userService) LoginWith2FA(ctx context.Context, email, password, code string, meta port.SessionMeta) (port.TokenPair, error) {
	user, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return port.TokenPair{}, domain.ErrInvalidCredentials
		}
		return port.TokenPair{}, fmt.Errorf("login 2fa: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return port.TokenPair{}, domain.ErrInvalidCredentials
	}

	if !user.TwoFactorEnabled || user.TwoFactorSecret == nil {
		return port.TokenPair{}, domain.ErrInvalidCredentials
	}

	if !totp.Validate(code, *user.TwoFactorSecret) {
		return port.TokenPair{}, domain.ErrInvalid2FACode
	}

	return s.issueTokens(ctx, user, meta)
}

// issueTokens creates a session row and generates a JWT pair.
func (s *userService) issueTokens(ctx context.Context, user domain.User, meta port.SessionMeta) (port.TokenPair, error) {
	session, err := s.repo.CreateSession(ctx, domain.Session{
		UserID:     user.ID,
		DeviceInfo: meta.DeviceInfo,
		IPAddress:  meta.IPAddress,
	})
	if err != nil {
		return port.TokenPair{}, fmt.Errorf("issue tokens: create session: %w", err)
	}

	var tokens *auth.TokenPair
	if s.cfg.KeyPair != nil {
		tokens, err = auth.GenerateTokenPairRS256(user.ID.String(), string(user.Role), s.cfg.KeyPair.Private)
	} else {
		tokens, err = auth.GenerateTokenPair(user.ID.String(), string(user.Role), s.cfg.JWTSecret)
	}
	if err != nil {
		return port.TokenPair{}, fmt.Errorf("issue tokens: generate: %w", err)
	}

	_ = s.publisher.PublishUserLoggedIn(ctx, user.ID)
	_ = session // session ID could be embedded in token's jti; left for Phase 2

	return port.TokenPair{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresAt:    tokens.ExpiresAt,
	}, nil
}

// RefreshToken validates the refresh token and issues a new pair (rotation).
func (s *userService) RefreshToken(ctx context.Context, refreshToken string, meta port.SessionMeta) (port.TokenPair, error) {
	var claims *auth.Claims
	var err error
	if s.cfg.KeyPair != nil {
		claims, err = auth.ValidateTokenEdDSA(refreshToken, s.cfg.KeyPair.Public)
	} else {
		claims, err = auth.ValidateToken(refreshToken, s.cfg.JWTSecret)
	}
	if err != nil {
		return port.TokenPair{}, domain.ErrInvalidCredentials
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return port.TokenPair{}, domain.ErrInvalidCredentials
	}

	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return port.TokenPair{}, fmt.Errorf("refresh: %w", err)
	}

	if user.Status != domain.StatusActive {
		return port.TokenPair{}, domain.ErrInvalidCredentials
	}

	return s.issueTokens(ctx, user, meta)
}

// GetProfile returns the user without the password hash.
func (s *userService) GetProfile(ctx context.Context, userID uuid.UUID) (domain.User, error) {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return domain.User{}, fmt.Errorf("get profile: %w", err)
	}
	user.PasswordHash = ""
	return user, nil
}

// UpdateProfile updates mutable profile fields (phone only for now).
func (s *userService) UpdateProfile(ctx context.Context, userID uuid.UUID, phone *string) (domain.User, error) {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return domain.User{}, fmt.Errorf("update profile: %w", err)
	}

	updated := user // immutable copy
	if phone != nil {
		updated.Phone = phone
	}

	result, err := s.repo.Update(ctx, updated)
	if err != nil {
		return domain.User{}, fmt.Errorf("update profile: %w", err)
	}

	result.PasswordHash = ""
	return result, nil
}

// Enable2FA generates a TOTP secret and stores it (enabled on first Verify2FA).
func (s *userService) Enable2FA(ctx context.Context, userID uuid.UUID) (port.Enable2FAResult, error) {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return port.Enable2FAResult{}, fmt.Errorf("enable 2fa: %w", err)
	}

	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      s.cfg.TOTPIssuer,
		AccountName: user.Email,
	})
	if err != nil {
		return port.Enable2FAResult{}, fmt.Errorf("enable 2fa: generate totp: %w", err)
	}

	secret := key.Secret()
	user.TwoFactorSecret = &secret
	// TwoFactorEnabled stays false until user confirms via Verify2FA

	if _, err := s.repo.Update(ctx, user); err != nil {
		return port.Enable2FAResult{}, fmt.Errorf("enable 2fa: store secret: %w", err)
	}

	return port.Enable2FAResult{
		Secret:         secret,
		ProvisioningURI: key.URL(),
	}, nil
}

// Verify2FA validates a TOTP code and activates 2FA on first success.
func (s *userService) Verify2FA(ctx context.Context, userID uuid.UUID, code string) error {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("verify 2fa: %w", err)
	}

	if user.TwoFactorSecret == nil {
		return domain.ErrInvalid2FACode
	}

	if !totp.Validate(code, *user.TwoFactorSecret) {
		return domain.ErrInvalid2FACode
	}

	if !user.TwoFactorEnabled {
		user.TwoFactorEnabled = true
		if _, err := s.repo.Update(ctx, user); err != nil {
			return fmt.Errorf("verify 2fa: enable: %w", err)
		}
		_ = s.publisher.PublishUser2FAEnabled(ctx, user.ID)
	}

	return nil
}

// ListSessions returns all active sessions for the user.
func (s *userService) ListSessions(ctx context.Context, userID uuid.UUID) ([]domain.Session, error) {
	sessions, err := s.repo.ListSessions(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list sessions: %w", err)
	}
	return sessions, nil
}

// RevokeSession checks ownership before revoking a session.
func (s *userService) RevokeSession(ctx context.Context, userID uuid.UUID, sessionID uuid.UUID) error {
	session, err := s.repo.FindSessionByID(ctx, sessionID)
	if err != nil {
		return fmt.Errorf("revoke session: %w", err)
	}

	if session.UserID != userID {
		return domain.ErrNotAuthorized
	}

	if err := s.repo.RevokeSession(ctx, sessionID); err != nil {
		return fmt.Errorf("revoke session: %w", err)
	}

	return nil
}

// DeleteAccount soft-deletes the user and revokes all sessions.
func (s *userService) DeleteAccount(ctx context.Context, userID uuid.UUID) error {
	if err := s.repo.RevokeAllSessions(ctx, userID); err != nil {
		return fmt.Errorf("delete account: revoke sessions: %w", err)
	}

	if err := s.repo.Delete(ctx, userID); err != nil {
		return fmt.Errorf("delete account: %w", err)
	}

	_ = s.publisher.PublishUserDeleted(ctx, userID)
	// TODO Phase 1 stabilization: schedule 30-day GDPR anonymization job.

	return nil
}
