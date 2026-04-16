package http

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
	"github.com/busexpress/pkg/validation"
)

// AgencyHandler manages multi-agency sub-accounts (CLAUDE.md §13.4).
type AgencyHandler struct {
	pool *pgxpool.Pool
}

// NewAgencyHandler constructs the handler.
func NewAgencyHandler(pool *pgxpool.Pool) *AgencyHandler {
	return &AgencyHandler{pool: pool}
}

// CreateAgencyRequest is the body for POST /api/v1/operator/agencies.
type CreateAgencyRequest struct {
	Name string  `json:"name" validate:"required,min=2,max=200"`
	City *string `json:"city,omitempty" validate:"omitempty,max=200"`
}

// AgencyResponse is the public representation.
type AgencyResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	City      *string   `json:"city,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// AddMemberRequest is the body for POST /api/v1/operator/agencies/{id}/members.
type AddMemberRequest struct {
	UserID string `json:"user_id" validate:"required,uuid"`
	Role   string `json:"role"    validate:"required,oneof=admin_operateur manager_agence agent_guichet"`
}

// MemberResponse is the public representation.
type MemberResponse struct {
	ID     string `json:"id"`
	UserID string `json:"user_id"`
	Role   string `json:"role"`
}

// CreateAgency handles POST /api/v1/operator/agencies.
func (h *AgencyHandler) CreateAgency(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	var req CreateAgencyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}

	// Look up the operator profile.
	var opID uuid.UUID
	if err := h.pool.QueryRow(r.Context(),
		"SELECT id FROM operator_profiles WHERE user_id = $1", userID,
	).Scan(&opID); err != nil {
		response.Error(w, apperrors.NewNotFound("operator profile not found"))
		return
	}

	id := uuid.New()
	_, err = h.pool.Exec(r.Context(), `
		INSERT INTO agencies (id, operator_id, name, city) VALUES ($1, $2, $3, $4)`,
		id, opID, req.Name, req.City,
	)
	if err != nil {
		response.Error(w, fmt.Errorf("insert agency: %w", err))
		return
	}
	response.JSON(w, http.StatusCreated, AgencyResponse{
		ID: id.String(), Name: req.Name, City: req.City, CreatedAt: time.Now().UTC(),
	})
}

// ListAgencies handles GET /api/v1/operator/agencies.
func (h *AgencyHandler) ListAgencies(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	var opID uuid.UUID
	if err := h.pool.QueryRow(r.Context(),
		"SELECT id FROM operator_profiles WHERE user_id = $1", userID,
	).Scan(&opID); err != nil {
		response.Error(w, apperrors.NewNotFound("operator profile not found"))
		return
	}
	rows, err := h.pool.Query(r.Context(), `
		SELECT id, name, city, created_at
		FROM agencies WHERE operator_id = $1 ORDER BY created_at`, opID,
	)
	if err != nil {
		response.Error(w, err)
		return
	}
	defer rows.Close()
	out := []AgencyResponse{}
	for rows.Next() {
		var a AgencyResponse
		if err := rows.Scan(&a.ID, &a.Name, &a.City, &a.CreatedAt); err != nil {
			response.Error(w, err)
			return
		}
		out = append(out, a)
	}
	response.JSON(w, http.StatusOK, map[string]any{"agencies": out})
}

// AddMember handles POST /api/v1/operator/agencies/{id}/members.
func (h *AgencyHandler) AddMember(w http.ResponseWriter, r *http.Request) {
	agencyID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid agency id"))
		return
	}
	var req AddMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	memberUserID, _ := uuid.Parse(req.UserID)
	id := uuid.New()
	_, err = h.pool.Exec(r.Context(), `
		INSERT INTO agency_members (id, agency_id, user_id, role)
		VALUES ($1, $2, $3, $4::agency_role)
		ON CONFLICT (agency_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
		id, agencyID, memberUserID, req.Role,
	)
	if err != nil {
		response.Error(w, fmt.Errorf("add member: %w", err))
		return
	}
	response.JSON(w, http.StatusCreated, MemberResponse{
		ID: id.String(), UserID: req.UserID, Role: req.Role,
	})
}

// ListMembers handles GET /api/v1/operator/agencies/{id}/members.
func (h *AgencyHandler) ListMembers(w http.ResponseWriter, r *http.Request) {
	agencyID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid agency id"))
		return
	}
	rows, err := h.pool.Query(r.Context(), `
		SELECT id, user_id, role FROM agency_members
		WHERE agency_id = $1 ORDER BY created_at`, agencyID,
	)
	if err != nil {
		response.Error(w, err)
		return
	}
	defer rows.Close()
	out := []MemberResponse{}
	for rows.Next() {
		var m MemberResponse
		if err := rows.Scan(&m.ID, &m.UserID, &m.Role); err != nil {
			response.Error(w, err)
			return
		}
		out = append(out, m)
	}
	response.JSON(w, http.StatusOK, map[string]any{"members": out})
}
