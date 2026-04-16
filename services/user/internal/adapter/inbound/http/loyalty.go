package http

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/busexpress/pkg/auth"
	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
)

// LoyaltyHandler exposes loyalty point endpoints.
type LoyaltyHandler struct {
	pool *pgxpool.Pool
}

// NewLoyaltyHandler constructs a handler.
func NewLoyaltyHandler(pool *pgxpool.Pool) *LoyaltyHandler {
	return &LoyaltyHandler{pool: pool}
}

// BalanceResponse shows the caller's loyalty points.
type BalanceResponse struct {
	UserID string `json:"user_id"`
	Points int    `json:"points"`
}

// LoyaltyTxResponse represents one point transaction.
type LoyaltyTxResponse struct {
	ID        string    `json:"id"`
	Points    int       `json:"points"`
	Reason    string    `json:"reason"`
	BookingID *string   `json:"booking_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// GetBalance handles GET /api/v1/users/me/loyalty.
func (h *LoyaltyHandler) GetBalance(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.ClaimsFromContext(r.Context())
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid user id"))
		return
	}
	var points int
	if err := h.pool.QueryRow(r.Context(),
		"SELECT COALESCE(loyalty_points, 0) FROM users WHERE id = $1", userID,
	).Scan(&points); err != nil {
		response.Error(w, fmt.Errorf("loyalty: %w", err))
		return
	}
	response.JSON(w, http.StatusOK, BalanceResponse{
		UserID: claims.UserID,
		Points: points,
	})
}

// GetHistory handles GET /api/v1/users/me/loyalty/history.
func (h *LoyaltyHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.ClaimsFromContext(r.Context())
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid user id"))
		return
	}
	rows, err := h.pool.Query(r.Context(), `
        SELECT id, points, reason, booking_id, created_at
        FROM loyalty_transactions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50`, userID,
	)
	if err != nil {
		response.Error(w, err)
		return
	}
	defer rows.Close()
	out := []LoyaltyTxResponse{}
	for rows.Next() {
		var tx LoyaltyTxResponse
		var bid *uuid.UUID
		if err := rows.Scan(&tx.ID, &tx.Points, &tx.Reason, &bid, &tx.CreatedAt); err != nil {
			response.Error(w, err)
			return
		}
		if bid != nil {
			s := bid.String()
			tx.BookingID = &s
		}
		out = append(out, tx)
	}
	response.JSON(w, http.StatusOK, map[string]any{"transactions": out})
}

// CreditRequest is the body for POST /api/v1/users/{id}/loyalty/credit.
// Callable by internal services (booking-service after confirm).
type CreditRequest struct {
	Points    int     `json:"points"    validate:"required,min=1"`
	Reason    string  `json:"reason"    validate:"required,min=1,max=60"`
	BookingID *string `json:"booking_id,omitempty" validate:"omitempty,uuid"`
}

// Credit handles POST /api/v1/admin/users/{id}/loyalty/credit (admin-only).
func (h *LoyaltyHandler) Credit(w http.ResponseWriter, r *http.Request) {
	var req CreditRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if req.Points < 1 || req.Reason == "" {
		response.Error(w, apperrors.NewValidation("points and reason required"))
		return
	}

	userIDStr := r.PathValue("id")
	if userIDStr == "" {
		response.Error(w, apperrors.NewValidation("user id required"))
		return
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid user id"))
		return
	}
	var bookingID *uuid.UUID
	if req.BookingID != nil {
		b, _ := uuid.Parse(*req.BookingID)
		bookingID = &b
	}

	ctx := r.Context()
	txID := uuid.New()
	if _, err := h.pool.Exec(ctx, `
        INSERT INTO loyalty_transactions (id, user_id, points, reason, booking_id)
        VALUES ($1, $2, $3, $4, $5)`,
		txID, userID, req.Points, req.Reason, bookingID,
	); err != nil {
		response.Error(w, fmt.Errorf("insert loyalty tx: %w", err))
		return
	}
	if _, err := h.pool.Exec(ctx, `
        UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2`,
		req.Points, userID,
	); err != nil {
		response.Error(w, fmt.Errorf("update points: %w", err))
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"user_id": userID.String(), "credited": req.Points, "tx_id": txID.String()})
}
