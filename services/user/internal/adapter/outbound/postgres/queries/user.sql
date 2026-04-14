-- name: GetUserByID :one
SELECT id, email, phone, password_hash, role, status, two_factor_enabled, two_factor_secret, guest_token, created_at, updated_at
FROM users
WHERE id = $1 AND status != 'deleted';

-- name: GetUserByEmail :one
SELECT id, email, phone, password_hash, role, status, two_factor_enabled, two_factor_secret, guest_token, created_at, updated_at
FROM users
WHERE email = $1 AND status != 'deleted';

-- name: CreateUser :one
INSERT INTO users (id, email, phone, password_hash, role, status, two_factor_enabled, guest_token, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id, email, phone, password_hash, role, status, two_factor_enabled, two_factor_secret, guest_token, created_at, updated_at;

-- name: UpdateUser :one
UPDATE users
SET email = $2, phone = $3, password_hash = $4, role = $5, status = $6,
    two_factor_enabled = $7, two_factor_secret = $8, guest_token = $9, updated_at = $10
WHERE id = $1
RETURNING id, email, phone, password_hash, role, status, two_factor_enabled, two_factor_secret, guest_token, created_at, updated_at;

-- name: DeleteUser :exec
UPDATE users SET status = 'deleted', updated_at = $2 WHERE id = $1;

-- name: ListSessionsByUserID :many
SELECT id, user_id, device_info, ip_address, created_at, last_active_at, revoked_at
FROM sessions
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: CreateSession :one
INSERT INTO sessions (id, user_id, device_info, ip_address, created_at, last_active_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, user_id, device_info, ip_address, created_at, last_active_at, revoked_at;

-- name: RevokeSession :exec
UPDATE sessions SET revoked_at = $2 WHERE id = $1 AND revoked_at IS NULL;
