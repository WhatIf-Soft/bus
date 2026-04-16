package http

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/busexpress/pkg/auth"
	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
	"github.com/busexpress/pkg/validation"
)

// AlertHandler manages price alert CRUD on the search-service's DB.
type AlertHandler struct {
	pool *pgxpool.Pool
}

// NewAlertHandler constructs the handler.
func NewAlertHandler(pool *pgxpool.Pool) *AlertHandler {
	return &AlertHandler{pool: pool}
}

// CreateAlertRequest is the body for POST /api/v1/search/alerts.
type CreateAlertRequest struct {
	OriginCity      string `json:"origin_city"      validate:"required,min=2,max=200"`
	DestinationCity string `json:"destination_city"  validate:"required,min=2,max=200"`
	MaxPriceCents   int    `json:"max_price_cents"  validate:"required,min=1"`
}

// AlertResponse is the public representation.
type AlertResponse struct {
	ID              string     `json:"id"`
	OriginCity      string     `json:"origin_city"`
	DestinationCity string     `json:"destination_city"`
	MaxPriceCents   int        `json:"max_price_cents"`
	Currency        string     `json:"currency"`
	Active          bool       `json:"active"`
	TriggeredAt     *time.Time `json:"triggered_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

// Create handles POST /api/v1/search/alerts.
func (h *AlertHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.ClaimsFromContext(r.Context())
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	userID, _ := uuid.Parse(claims.UserID)

	var req CreateAlertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}

	id := uuid.New()
	_, err = h.pool.Exec(r.Context(), `
        INSERT INTO price_alerts
            (id, user_id, origin_city, destination_city, max_price_cents)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, origin_city, destination_city) DO UPDATE SET
            max_price_cents = EXCLUDED.max_price_cents, active = TRUE, triggered_at = NULL`,
		id, userID, req.OriginCity, req.DestinationCity, req.MaxPriceCents,
	)
	if err != nil {
		response.Error(w, fmt.Errorf("insert alert: %w", err))
		return
	}
	response.JSON(w, http.StatusCreated, AlertResponse{
		ID: id.String(), OriginCity: req.OriginCity,
		DestinationCity: req.DestinationCity,
		MaxPriceCents:   req.MaxPriceCents,
		Currency:        "XOF", Active: true,
		CreatedAt: time.Now().UTC(),
	})
}

// List handles GET /api/v1/search/alerts.
func (h *AlertHandler) List(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.ClaimsFromContext(r.Context())
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	userID, _ := uuid.Parse(claims.UserID)

	rows, err := h.pool.Query(r.Context(), `
        SELECT id, origin_city, destination_city, max_price_cents, currency,
               active, triggered_at, created_at
        FROM price_alerts
        WHERE user_id = $1
        ORDER BY created_at DESC LIMIT 50`, userID,
	)
	if err != nil {
		response.Error(w, err)
		return
	}
	defer rows.Close()

	out := make([]AlertResponse, 0)
	for rows.Next() {
		var a AlertResponse
		if err := rows.Scan(
			&a.ID, &a.OriginCity, &a.DestinationCity, &a.MaxPriceCents,
			&a.Currency, &a.Active, &a.TriggeredAt, &a.CreatedAt,
		); err != nil {
			response.Error(w, err)
			return
		}
		out = append(out, a)
	}
	response.JSON(w, http.StatusOK, map[string]any{"alerts": out})
}

// Delete handles DELETE /api/v1/search/alerts/{id}.
func (h *AlertHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims, err := auth.ClaimsFromContext(r.Context())
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	userID, _ := uuid.Parse(claims.UserID)
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid alert id"))
		return
	}
	tag, err := h.pool.Exec(r.Context(),
		"DELETE FROM price_alerts WHERE id = $1 AND user_id = $2", id, userID,
	)
	if err != nil {
		response.Error(w, err)
		return
	}
	if tag.RowsAffected() == 0 {
		response.Error(w, apperrors.NewNotFound("alert not found"))
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// CheckTriggered is a background helper that scans active alerts against
// current trip prices. Called by the sweeper goroutine. For each triggered
// alert, sets triggered_at and active=false. In production this would
// dispatch a notification; for MVP it just marks the row.
func CheckTriggered(ctx context.Context, pool *pgxpool.Pool) (int, error) {
	const q = `
        UPDATE price_alerts pa
        SET active = FALSE, triggered_at = NOW()
        FROM trips t
        JOIN routes r ON r.id = t.route_id
        JOIN stops os ON os.id = r.origin_stop_id
        JOIN stops ds ON ds.id = r.destination_stop_id
        WHERE pa.active = TRUE
          AND LOWER(os.city) = LOWER(pa.origin_city)
          AND LOWER(ds.city) = LOWER(pa.destination_city)
          AND t.price_cents <= pa.max_price_cents
          AND t.status = 'scheduled'
          AND t.departure_time > NOW()`
	tag, err := pool.Exec(ctx, q)
	if err != nil {
		return 0, fmt.Errorf("check price alerts: %w", err)
	}
	return int(tag.RowsAffected()), nil
}
