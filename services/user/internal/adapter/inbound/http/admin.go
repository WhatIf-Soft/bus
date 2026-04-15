package http

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
)

// AdminHandler exposes back-office user-management endpoints. It bypasses the
// service layer because admin operations are intentionally low-level (direct
// role + status mutations); higher-volume work belongs in a dedicated
// admin-service.
type AdminHandler struct {
	pool *pgxpool.Pool
}

// NewAdminHandler constructs an AdminHandler.
func NewAdminHandler(pool *pgxpool.Pool) *AdminHandler {
	return &AdminHandler{pool: pool}
}

// AdminUserResponse is the public representation of a user for admins.
type AdminUserResponse struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Phone     *string   `json:"phone,omitempty"`
	Role      string    `json:"role"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

// ListAdminUsersResponse wraps a paginated user list.
type ListAdminUsersResponse struct {
	Users  []AdminUserResponse `json:"users"`
	Total  int                 `json:"total"`
	Limit  int                 `json:"limit"`
	Offset int                 `json:"offset"`
}

// PatchUserRequest is the body for PATCH /api/v1/admin/users/{id}.
// Both fields are optional; at least one must be provided.
type PatchUserRequest struct {
	Role   *string `json:"role,omitempty"`
	Status *string `json:"status,omitempty"`
}

// ListUsers handles GET /api/v1/admin/users.
func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}

	ctx := r.Context()
	var total int
	if err := h.pool.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&total); err != nil {
		response.Error(w, fmt.Errorf("count users: %w", err))
		return
	}
	rows, err := h.pool.Query(ctx, `
        SELECT id, email, phone, role, status, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2`, limit, offset,
	)
	if err != nil {
		response.Error(w, fmt.Errorf("list users: %w", err))
		return
	}
	defer rows.Close()

	out := make([]AdminUserResponse, 0, limit)
	for rows.Next() {
		var u AdminUserResponse
		if err := rows.Scan(&u.ID, &u.Email, &u.Phone, &u.Role, &u.Status, &u.CreatedAt); err != nil {
			response.Error(w, err)
			return
		}
		out = append(out, u)
	}
	response.JSON(w, http.StatusOK, ListAdminUsersResponse{
		Users: out, Total: total, Limit: limit, Offset: offset,
	})
}

// PatchUser handles PATCH /api/v1/admin/users/{id}.
func (h *AdminHandler) PatchUser(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid user id"))
		return
	}
	var req PatchUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if req.Role == nil && req.Status == nil {
		response.Error(w, apperrors.NewValidation("at least one of role/status required"))
		return
	}
	if req.Role != nil {
		switch *req.Role {
		case "voyageur", "operateur", "agent_support", "admin":
		default:
			response.Error(w, apperrors.NewValidation("invalid role"))
			return
		}
	}
	if req.Status != nil {
		switch *req.Status {
		case "active", "suspended", "deleted":
		default:
			response.Error(w, apperrors.NewValidation("invalid status"))
			return
		}
	}

	ctx := r.Context()
	if req.Role != nil {
		if _, err := h.pool.Exec(ctx,
			"UPDATE users SET role = $1::user_role, updated_at = NOW() WHERE id = $2",
			*req.Role, id,
		); err != nil {
			response.Error(w, fmt.Errorf("update role: %w", err))
			return
		}
	}
	if req.Status != nil {
		if _, err := h.pool.Exec(ctx,
			"UPDATE users SET status = $1::user_status, updated_at = NOW() WHERE id = $2",
			*req.Status, id,
		); err != nil {
			response.Error(w, fmt.Errorf("update status: %w", err))
			return
		}
		// Revoking sessions when suspending/deleting.
		if *req.Status != "active" {
			if _, err := h.pool.Exec(ctx,
				"UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
				id,
			); err != nil {
				// Best-effort; log via header.
				w.Header().Set("X-Sessions-Revoke-Warn", err.Error())
			}
		}
	}

	// Echo back the updated record.
	u, err := readAdminUser(ctx, h.pool, id)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, u)
}

func readAdminUser(ctx context.Context, pool *pgxpool.Pool, id uuid.UUID) (AdminUserResponse, error) {
	var u AdminUserResponse
	err := pool.QueryRow(ctx, `
        SELECT id, email, phone, role, status, created_at
        FROM users WHERE id = $1`, id,
	).Scan(&u.ID, &u.Email, &u.Phone, &u.Role, &u.Status, &u.CreatedAt)
	return u, err
}
