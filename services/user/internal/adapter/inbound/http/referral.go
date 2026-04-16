package http

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/busexpress/pkg/auth"
	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
)

// ReferralHandler manages the referral / parrainage system.
type ReferralHandler struct {
	pool           *pgxpool.Pool
	pointsPerRefer int
}

// NewReferralHandler constructs the handler. pointsPerRefer defaults to 500 (5 XOF equiv).
func NewReferralHandler(pool *pgxpool.Pool) *ReferralHandler {
	return &ReferralHandler{pool: pool, pointsPerRefer: 500}
}

// GetCode handles GET /api/v1/users/me/referral.
func (h *ReferralHandler) GetCode(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.ClaimsFromContext(r.Context())
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	userID, _ := uuid.Parse(claims.UserID)

	var code string
	err = h.pool.QueryRow(r.Context(),
		"SELECT COALESCE(referral_code, '') FROM users WHERE id = $1", userID,
	).Scan(&code)
	if err != nil {
		response.Error(w, err)
		return
	}
	if code == "" {
		code = fmt.Sprintf("%08X", userID.ID())
		_, _ = h.pool.Exec(r.Context(),
			"UPDATE users SET referral_code = $1 WHERE id = $2 AND referral_code IS NULL",
			code, userID)
	}

	var referralCount int
	_ = h.pool.QueryRow(r.Context(),
		"SELECT COUNT(*) FROM referral_rewards WHERE referrer_id = $1", userID,
	).Scan(&referralCount)

	response.JSON(w, http.StatusOK, map[string]any{
		"referral_code":  code,
		"referral_count": referralCount,
		"points_per_referral": h.pointsPerRefer,
	})
}

// ApplyCodeRequest is the body for POST /api/v1/users/me/referral/apply.
type ApplyCodeRequest struct {
	Code string `json:"code" validate:"required,min=4,max=12"`
}

// ApplyCode handles POST /api/v1/users/me/referral/apply.
func (h *ReferralHandler) ApplyCode(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.ClaimsFromContext(r.Context())
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	userID, _ := uuid.Parse(claims.UserID)

	var req ApplyCodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}

	ctx := r.Context()

	// Check if user already has a referrer.
	var existingRef *uuid.UUID
	_ = h.pool.QueryRow(ctx,
		"SELECT referred_by FROM users WHERE id = $1", userID,
	).Scan(&existingRef)
	if existingRef != nil {
		response.Error(w, apperrors.NewConflict("you have already used a referral code"))
		return
	}

	// Find the referrer by code.
	var referrerID uuid.UUID
	err = h.pool.QueryRow(ctx,
		"SELECT id FROM users WHERE referral_code = $1 AND id != $2", req.Code, userID,
	).Scan(&referrerID)
	if err != nil {
		response.Error(w, apperrors.NewNotFound("invalid referral code"))
		return
	}

	// Apply referral.
	_, _ = h.pool.Exec(ctx,
		"UPDATE users SET referred_by = $1 WHERE id = $2", referrerID, userID)

	// Award points to both.
	rewardID := uuid.New()
	_, _ = h.pool.Exec(ctx, `
        INSERT INTO referral_rewards (id, referrer_id, referee_id, points_awarded)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING`, rewardID, referrerID, userID, h.pointsPerRefer)

	_, _ = h.pool.Exec(ctx,
		"UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2",
		h.pointsPerRefer, referrerID)
	_, _ = h.pool.Exec(ctx,
		"UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2",
		h.pointsPerRefer, userID)

	response.JSON(w, http.StatusOK, map[string]any{
		"status":         "applied",
		"points_awarded": h.pointsPerRefer,
		"referrer_id":    referrerID.String(),
	})
}
