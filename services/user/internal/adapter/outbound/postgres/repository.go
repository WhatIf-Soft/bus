package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/busexpress/services/user/internal/domain"
	"github.com/busexpress/services/user/internal/port"
)

// postgresUserRepo implements port.UserRepository using PostgreSQL via pgx.
type postgresUserRepo struct {
	pool *pgxpool.Pool
}

// NewPostgresUserRepository creates a UserRepository backed by a pgx connection pool.
func NewPostgresUserRepository(pool *pgxpool.Pool) port.UserRepository {
	return &postgresUserRepo{pool: pool}
}

func (r *postgresUserRepo) Create(ctx context.Context, user domain.User) (domain.User, error) {
	query := `
		INSERT INTO users (id, email, phone, password_hash, role, status, two_factor_enabled, guest_token, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, email, phone, password_hash, role, status, two_factor_enabled, two_factor_secret, guest_token, created_at, updated_at`

	now := time.Now().UTC()
	id := uuid.New()

	var created domain.User
	err := r.pool.QueryRow(ctx, query,
		id, user.Email, user.Phone, user.PasswordHash,
		user.Role, user.Status, user.TwoFactorEnabled,
		user.GuestToken, now, now,
	).Scan(
		&created.ID, &created.Email, &created.Phone, &created.PasswordHash,
		&created.Role, &created.Status, &created.TwoFactorEnabled,
		&created.TwoFactorSecret, &created.GuestToken,
		&created.CreatedAt, &created.UpdatedAt,
	)
	if err != nil {
		return domain.User{}, fmt.Errorf("create user: %w", err)
	}

	return created, nil
}

func (r *postgresUserRepo) FindByID(ctx context.Context, id uuid.UUID) (domain.User, error) {
	query := `
		SELECT id, email, phone, password_hash, role, status, two_factor_enabled, two_factor_secret, guest_token, created_at, updated_at
		FROM users
		WHERE id = $1 AND status != 'deleted'`

	var user domain.User
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.Phone, &user.PasswordHash,
		&user.Role, &user.Status, &user.TwoFactorEnabled,
		&user.TwoFactorSecret, &user.GuestToken,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, domain.ErrUserNotFound
		}
		return domain.User{}, fmt.Errorf("find user by id: %w", err)
	}

	return user, nil
}

func (r *postgresUserRepo) FindByEmail(ctx context.Context, email string) (domain.User, error) {
	query := `
		SELECT id, email, phone, password_hash, role, status, two_factor_enabled, two_factor_secret, guest_token, created_at, updated_at
		FROM users
		WHERE email = $1 AND status != 'deleted'`

	var user domain.User
	err := r.pool.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.Phone, &user.PasswordHash,
		&user.Role, &user.Status, &user.TwoFactorEnabled,
		&user.TwoFactorSecret, &user.GuestToken,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, domain.ErrUserNotFound
		}
		return domain.User{}, fmt.Errorf("find user by email: %w", err)
	}

	return user, nil
}

func (r *postgresUserRepo) Update(ctx context.Context, user domain.User) (domain.User, error) {
	query := `
		UPDATE users
		SET email = $2, phone = $3, password_hash = $4, role = $5, status = $6,
		    two_factor_enabled = $7, two_factor_secret = $8, guest_token = $9, updated_at = $10
		WHERE id = $1
		RETURNING id, email, phone, password_hash, role, status, two_factor_enabled, two_factor_secret, guest_token, created_at, updated_at`

	now := time.Now().UTC()
	var updated domain.User
	err := r.pool.QueryRow(ctx, query,
		user.ID, user.Email, user.Phone, user.PasswordHash,
		user.Role, user.Status, user.TwoFactorEnabled,
		user.TwoFactorSecret, user.GuestToken, now,
	).Scan(
		&updated.ID, &updated.Email, &updated.Phone, &updated.PasswordHash,
		&updated.Role, &updated.Status, &updated.TwoFactorEnabled,
		&updated.TwoFactorSecret, &updated.GuestToken,
		&updated.CreatedAt, &updated.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, domain.ErrUserNotFound
		}
		return domain.User{}, fmt.Errorf("update user: %w", err)
	}

	return updated, nil
}

func (r *postgresUserRepo) Delete(ctx context.Context, id uuid.UUID) error {
	// Soft delete: mark status as 'deleted'.
	query := `UPDATE users SET status = 'deleted', updated_at = $2 WHERE id = $1`
	now := time.Now().UTC()

	tag, err := r.pool.Exec(ctx, query, id, now)
	if err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrUserNotFound
	}

	return nil
}

func (r *postgresUserRepo) CreateSession(ctx context.Context, s domain.Session) (domain.Session, error) {
	query := `
		INSERT INTO sessions (id, user_id, device_info, ip_address, created_at, last_active_at)
		VALUES ($1, $2, $3, $4, $5, $5)
		RETURNING id, user_id, device_info, ip_address, created_at, last_active_at, revoked_at`

	id := s.ID
	if id == uuid.Nil {
		id = uuid.New()
	}
	now := time.Now().UTC()

	var created domain.Session
	err := r.pool.QueryRow(ctx, query, id, s.UserID, s.DeviceInfo, s.IPAddress, now).Scan(
		&created.ID, &created.UserID, &created.DeviceInfo, &created.IPAddress,
		&created.CreatedAt, &created.LastActiveAt, &created.RevokedAt,
	)
	if err != nil {
		return domain.Session{}, fmt.Errorf("create session: %w", err)
	}

	return created, nil
}

func (r *postgresUserRepo) FindSessionByID(ctx context.Context, id uuid.UUID) (domain.Session, error) {
	query := `
		SELECT id, user_id, device_info, ip_address, created_at, last_active_at, revoked_at
		FROM sessions
		WHERE id = $1`

	var s domain.Session
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&s.ID, &s.UserID, &s.DeviceInfo, &s.IPAddress,
		&s.CreatedAt, &s.LastActiveAt, &s.RevokedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Session{}, domain.ErrSessionRevoked
		}
		return domain.Session{}, fmt.Errorf("find session: %w", err)
	}

	return s, nil
}

func (r *postgresUserRepo) ListSessions(ctx context.Context, userID uuid.UUID) ([]domain.Session, error) {
	query := `
		SELECT id, user_id, device_info, ip_address, created_at, last_active_at, revoked_at
		FROM sessions
		WHERE user_id = $1
		ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("list sessions: %w", err)
	}
	defer rows.Close()

	var sessions []domain.Session
	for rows.Next() {
		var s domain.Session
		if err := rows.Scan(
			&s.ID, &s.UserID, &s.DeviceInfo, &s.IPAddress,
			&s.CreatedAt, &s.LastActiveAt, &s.RevokedAt,
		); err != nil {
			return nil, fmt.Errorf("list sessions scan: %w", err)
		}
		sessions = append(sessions, s)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list sessions rows: %w", err)
	}

	return sessions, nil
}

func (r *postgresUserRepo) RevokeSession(ctx context.Context, sessionID uuid.UUID) error {
	query := `UPDATE sessions SET revoked_at = $2 WHERE id = $1 AND revoked_at IS NULL`
	now := time.Now().UTC()

	tag, err := r.pool.Exec(ctx, query, sessionID, now)
	if err != nil {
		return fmt.Errorf("revoke session: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrSessionRevoked
	}

	return nil
}

func (r *postgresUserRepo) RevokeAllSessions(ctx context.Context, userID uuid.UUID) error {
	query := `UPDATE sessions SET revoked_at = $2 WHERE user_id = $1 AND revoked_at IS NULL`
	now := time.Now().UTC()

	_, err := r.pool.Exec(ctx, query, userID, now)
	if err != nil {
		return fmt.Errorf("revoke all sessions: %w", err)
	}

	return nil
}
