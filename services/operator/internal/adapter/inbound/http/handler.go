package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/busexpress/pkg/auth"
	apperrors "github.com/busexpress/pkg/errors"
	"github.com/busexpress/pkg/response"
	"github.com/busexpress/pkg/validation"

	"github.com/busexpress/services/operator/internal/domain"
	"github.com/busexpress/services/operator/internal/port"
)

// Handler exposes operator-service HTTP endpoints.
type Handler struct {
	service port.OperatorService
}

// NewHandler builds a Handler.
func NewHandler(svc port.OperatorService) *Handler {
	return &Handler{service: svc}
}

func userFromCtx(r *http.Request) (uuid.UUID, string, error) {
	claims, err := auth.ClaimsFromContext(r.Context())
	if err != nil {
		return uuid.Nil, "", err
	}
	id, err := uuid.Parse(claims.UserID)
	return id, claims.Role, err
}

// GetProfile handles GET /api/v1/operator/profile.
// Auto-creates a profile on first call so an operator can immediately start
// configuring fleet/policies.
func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	defaultName := r.URL.Query().Get("default_name")
	p, err := h.service.GetOrCreateProfile(r.Context(), userID, defaultName)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toProfileResponse(p))
}

// UpdateProfile handles PUT /api/v1/operator/profile.
func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	p, err := h.service.UpdateProfile(r.Context(), userID, port.UpdateProfileRequest{
		Name: req.Name, ContactEmail: req.ContactEmail,
		ContactPhone: req.ContactPhone, Address: req.Address,
	})
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toProfileResponse(p))
}

// CreateBus handles POST /api/v1/operator/buses.
func (h *Handler) CreateBus(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	var req CreateBusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	b, err := h.service.CreateBus(r.Context(), userID, port.CreateBusRequest{
		LicensePlate: req.LicensePlate, Model: req.Model,
		Capacity: req.Capacity, Class: domain.BusClass(req.Class),
		Amenities: req.Amenities,
	})
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, toBusResponse(b))
}

// ListBuses handles GET /api/v1/operator/buses.
func (h *Handler) ListBuses(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	buses, total, err := h.service.ListBuses(r.Context(), userID, limit, offset)
	if err != nil {
		mapError(w, err)
		return
	}
	out := make([]BusResponse, 0, len(buses))
	for i := range buses {
		out = append(out, toBusResponse(&buses[i]))
	}
	response.JSON(w, http.StatusOK, ListResponse[BusResponse]{
		Items: out, Total: total, Limit: limit, Offset: offset,
	})
}

// UpdateBus handles PUT /api/v1/operator/buses/{id}.
func (h *Handler) UpdateBus(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid bus id"))
		return
	}
	var req UpdateBusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	var class *domain.BusClass
	if req.Class != nil {
		c := domain.BusClass(*req.Class)
		class = &c
	}
	var status *domain.BusStatus
	if req.Status != nil {
		s := domain.BusStatus(*req.Status)
		status = &s
	}
	b, err := h.service.UpdateBus(r.Context(), userID, id, port.UpdateBusRequest{
		Model: req.Model, Capacity: req.Capacity, Class: class,
		Amenities: req.Amenities, Status: status,
	})
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toBusResponse(b))
}

// DeleteBus handles DELETE /api/v1/operator/buses/{id}.
func (h *Handler) DeleteBus(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid bus id"))
		return
	}
	if err := h.service.DeleteBus(r.Context(), userID, id); err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// CreateDriver handles POST /api/v1/operator/drivers.
func (h *Handler) CreateDriver(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	var req CreateDriverRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	d, err := h.service.CreateDriver(r.Context(), userID, port.CreateDriverRequest{
		FirstName: req.FirstName, LastName: req.LastName,
		LicenseNumber: req.LicenseNumber, Phone: req.Phone,
		LicenseExpiresAt: req.LicenseExpiresAt,
	})
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, toDriverResponse(d))
}

// ListDrivers handles GET /api/v1/operator/drivers.
func (h *Handler) ListDrivers(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	drivers, total, err := h.service.ListDrivers(r.Context(), userID, limit, offset)
	if err != nil {
		mapError(w, err)
		return
	}
	out := make([]DriverResponse, 0, len(drivers))
	for i := range drivers {
		out = append(out, toDriverResponse(&drivers[i]))
	}
	response.JSON(w, http.StatusOK, ListResponse[DriverResponse]{
		Items: out, Total: total, Limit: limit, Offset: offset,
	})
}

// UpdateDriver handles PUT /api/v1/operator/drivers/{id}.
func (h *Handler) UpdateDriver(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid driver id"))
		return
	}
	var req UpdateDriverRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	var status *domain.DriverStatus
	if req.Status != nil {
		s := domain.DriverStatus(*req.Status)
		status = &s
	}
	d, err := h.service.UpdateDriver(r.Context(), userID, id, port.UpdateDriverRequest{
		FirstName: req.FirstName, LastName: req.LastName,
		LicenseNumber: req.LicenseNumber, Phone: req.Phone,
		LicenseExpiresAt: req.LicenseExpiresAt, Status: status,
	})
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toDriverResponse(d))
}

// DeleteDriver handles DELETE /api/v1/operator/drivers/{id}.
func (h *Handler) DeleteDriver(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, apperrors.NewValidation("invalid driver id"))
		return
	}
	if err := h.service.DeleteDriver(r.Context(), userID, id); err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// GetCancellationPolicy handles GET /api/v1/operator/policies/cancellation.
func (h *Handler) GetCancellationPolicy(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	p, err := h.service.GetCancellationPolicy(r.Context(), userID)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, CancellationPolicyResponse{
		RefundPct24h: p.RefundPct24h, RefundPct2to24h: p.RefundPct2to24h,
		RefundPctUnder2h: p.RefundPctUnder2h, UpdatedAt: p.UpdatedAt.Format("2006-01-02 15:04:05"),
	})
}

// PutCancellationPolicy handles PUT /api/v1/operator/policies/cancellation.
func (h *Handler) PutCancellationPolicy(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	var req CancellationPolicyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	p, err := h.service.UpsertCancellationPolicy(r.Context(), userID, domain.CancellationPolicy{
		RefundPct24h: req.RefundPct24h, RefundPct2to24h: req.RefundPct2to24h,
		RefundPctUnder2h: req.RefundPctUnder2h,
	})
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, CancellationPolicyResponse{
		RefundPct24h: p.RefundPct24h, RefundPct2to24h: p.RefundPct2to24h,
		RefundPctUnder2h: p.RefundPctUnder2h, UpdatedAt: p.UpdatedAt.Format("2006-01-02 15:04:05"),
	})
}

// GetBaggagePolicy handles GET /api/v1/operator/policies/baggage.
func (h *Handler) GetBaggagePolicy(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	p, err := h.service.GetBaggagePolicy(r.Context(), userID)
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, BaggagePolicyResponse{
		FreeKg: p.FreeKg, ExtraFeePerKgCents: p.ExtraFeePerKgCents,
		MaxKgPerPassenger: p.MaxKgPerPassenger,
		UpdatedAt:         p.UpdatedAt.Format("2006-01-02 15:04:05"),
	})
}

// PutBaggagePolicy handles PUT /api/v1/operator/policies/baggage.
func (h *Handler) PutBaggagePolicy(w http.ResponseWriter, r *http.Request) {
	userID, _, err := userFromCtx(r)
	if err != nil {
		response.Error(w, apperrors.NewUnauthorized("invalid token"))
		return
	}
	var req BaggagePolicyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidation("invalid JSON"))
		return
	}
	if err := validation.ValidateStruct(&req); err != nil {
		response.Error(w, err)
		return
	}
	p, err := h.service.UpsertBaggagePolicy(r.Context(), userID, domain.BaggagePolicy{
		FreeKg: req.FreeKg, ExtraFeePerKgCents: req.ExtraFeePerKgCents,
		MaxKgPerPassenger: req.MaxKgPerPassenger,
	})
	if err != nil {
		mapError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, BaggagePolicyResponse{
		FreeKg: p.FreeKg, ExtraFeePerKgCents: p.ExtraFeePerKgCents,
		MaxKgPerPassenger: p.MaxKgPerPassenger,
		UpdatedAt:         p.UpdatedAt.Format("2006-01-02 15:04:05"),
	})
}

func mapError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrProfileNotFound),
		errors.Is(err, domain.ErrBusNotFound),
		errors.Is(err, domain.ErrDriverNotFound):
		response.Error(w, apperrors.NewNotFound(err.Error()))
	case errors.Is(err, domain.ErrNotOwner):
		response.Error(w, apperrors.NewForbidden(err.Error()))
	case errors.Is(err, domain.ErrLicensePlateConflict),
		errors.Is(err, domain.ErrLicenseNumberConflict),
		errors.Is(err, domain.ErrProfileExists):
		response.Error(w, apperrors.NewConflict(err.Error()))
	case errors.Is(err, domain.ErrInvalidPolicy):
		response.Error(w, apperrors.NewValidation(err.Error()))
	default:
		response.Error(w, err)
	}
}
