package http

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
)

// GatewayHandler manages B2B API key CRUD + validation.
type GatewayHandler struct {
	pool *pgxpool.Pool
}

// NewGatewayHandler constructs the handler.
func NewGatewayHandler(pool *pgxpool.Pool) *GatewayHandler {
	return &GatewayHandler{pool: pool}
}

// CreateKeyRequest is the body for POST /api/v1/gateway/keys.
type CreateKeyRequest struct {
	Name       string `json:"name"        validate:"required,min=3,max=200"`
	OwnerEmail string `json:"owner_email" validate:"required,email"`
	Tier       string `json:"tier"        validate:"required,oneof=free certified"`
}

// KeyResponse is the public representation (key shown only at creation).
type KeyResponse struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Tier     string `json:"tier"`
	RateRPM  int    `json:"rate_limit_rpm"`
	Key      string `json:"key,omitempty"`
	Active   bool   `json:"active"`
}

func hashKey(key string) string {
	h := sha256.Sum256([]byte(key))
	return hex.EncodeToString(h[:])
}

// CreateKey handles POST /api/v1/gateway/keys (admin-only).
func (h *GatewayHandler) CreateKey(w http.ResponseWriter, r *http.Request) {
	var req CreateKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	rawKey := fmt.Sprintf("bx_%s_%s", req.Tier, uuid.New().String())
	hash := hashKey(rawKey)

	rateRPM := 100
	if req.Tier == "certified" {
		rateRPM = 1000
	}

	id := uuid.New()
	_, err := h.pool.Exec(r.Context(), `
        INSERT INTO api_keys (id, key_hash, name, owner_email, tier, rate_limit_rpm)
        VALUES ($1, $2, $3, $4, $5::api_key_tier, $6)`,
		id, hash, req.Name, req.OwnerEmail, req.Tier, rateRPM,
	)
	if err != nil {
		response.Error(w, fmt.Errorf("insert key: %w", err))
		return
	}
	response.JSON(w, http.StatusCreated, KeyResponse{
		ID: id.String(), Name: req.Name, Tier: req.Tier,
		RateRPM: rateRPM, Key: rawKey, Active: true,
	})
}

// ListKeys handles GET /api/v1/gateway/keys (admin-only).
func (h *GatewayHandler) ListKeys(w http.ResponseWriter, r *http.Request) {
	rows, err := h.pool.Query(r.Context(), `
        SELECT id, name, tier, rate_limit_rpm, active
        FROM api_keys ORDER BY created_at DESC LIMIT 100`)
	if err != nil {
		response.Error(w, err)
		return
	}
	defer rows.Close()
	out := []KeyResponse{}
	for rows.Next() {
		var k KeyResponse
		if err := rows.Scan(&k.ID, &k.Name, &k.Tier, &k.RateRPM, &k.Active); err != nil {
			response.Error(w, err)
			return
		}
		out = append(out, k)
	}
	response.JSON(w, http.StatusOK, map[string]any{"keys": out})
}

// ValidateKey handles GET /api/v1/gateway/validate?key=...
// Called by downstream services to verify an API key on inbound requests.
func (h *GatewayHandler) ValidateKey(w http.ResponseWriter, r *http.Request) {
	raw := r.URL.Query().Get("key")
	if raw == "" {
		response.Error(w, apperrors.NewValidation("key param required"))
		return
	}
	hash := hashKey(raw)

	var id, name, tier string
	var rateRPM int
	err := h.pool.QueryRow(r.Context(), `
        SELECT id, name, tier, rate_limit_rpm
        FROM api_keys WHERE key_hash = $1 AND active = TRUE`, hash,
	).Scan(&id, &name, &tier, &rateRPM)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid API key"))
		return
	}

	_, _ = h.pool.Exec(r.Context(),
		"UPDATE api_keys SET last_used_at = NOW() WHERE id = $1", id)

	response.JSON(w, http.StatusOK, KeyResponse{
		ID: id, Name: name, Tier: tier, RateRPM: rateRPM, Active: true,
	})
}

