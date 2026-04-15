package http

import (
	"time"

	"github.com/busexpress/services/operator/internal/domain"
)

// ProfileResponse is the public representation of an operator profile.
type ProfileResponse struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	ContactEmail *string `json:"contact_email,omitempty"`
	ContactPhone *string `json:"contact_phone,omitempty"`
	Address      *string `json:"address,omitempty"`
}

// UpdateProfileRequest patches profile fields.
type UpdateProfileRequest struct {
	Name         *string `json:"name,omitempty" validate:"omitempty,min=1,max=200"`
	ContactEmail *string `json:"contact_email,omitempty" validate:"omitempty,email"`
	ContactPhone *string `json:"contact_phone,omitempty" validate:"omitempty,e164"`
	Address      *string `json:"address,omitempty"`
}

// CreateBusRequest is the body for POST /api/v1/operator/buses.
type CreateBusRequest struct {
	LicensePlate string   `json:"license_plate" validate:"required,min=1,max=20"`
	Model        string   `json:"model"         validate:"required,min=1,max=120"`
	Capacity     int      `json:"capacity"      validate:"required,min=1,max=80"`
	Class        string   `json:"class"         validate:"required,oneof=standard vip sleeper"`
	Amenities    []string `json:"amenities"     validate:"omitempty,dive,min=1,max=40"`
}

// UpdateBusRequest patches a bus.
type UpdateBusRequest struct {
	Model     *string   `json:"model,omitempty"     validate:"omitempty,min=1,max=120"`
	Capacity  *int      `json:"capacity,omitempty"  validate:"omitempty,min=1,max=80"`
	Class     *string   `json:"class,omitempty"     validate:"omitempty,oneof=standard vip sleeper"`
	Amenities *[]string `json:"amenities,omitempty"`
	Status    *string   `json:"status,omitempty"    validate:"omitempty,oneof=active maintenance retired"`
}

// BusResponse is the public representation of a bus.
type BusResponse struct {
	ID           string    `json:"id"`
	LicensePlate string    `json:"license_plate"`
	Model        string    `json:"model"`
	Capacity     int       `json:"capacity"`
	Class        string    `json:"class"`
	Amenities    []string  `json:"amenities"`
	Status       string    `json:"status"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// CreateDriverRequest is the body for POST /api/v1/operator/drivers.
type CreateDriverRequest struct {
	FirstName        string  `json:"first_name"        validate:"required,min=1,max=100"`
	LastName         string  `json:"last_name"         validate:"required,min=1,max=100"`
	LicenseNumber    string  `json:"license_number"    validate:"required,min=3,max=60"`
	Phone            *string `json:"phone,omitempty"   validate:"omitempty,e164"`
	LicenseExpiresAt string  `json:"license_expires_at" validate:"required,datetime=2006-01-02"`
}

// UpdateDriverRequest patches a driver.
type UpdateDriverRequest struct {
	FirstName        *string `json:"first_name,omitempty"        validate:"omitempty,min=1,max=100"`
	LastName         *string `json:"last_name,omitempty"         validate:"omitempty,min=1,max=100"`
	LicenseNumber    *string `json:"license_number,omitempty"    validate:"omitempty,min=3,max=60"`
	Phone            *string `json:"phone,omitempty"             validate:"omitempty,e164"`
	LicenseExpiresAt *string `json:"license_expires_at,omitempty" validate:"omitempty,datetime=2006-01-02"`
	Status           *string `json:"status,omitempty"            validate:"omitempty,oneof=active on_leave suspended former"`
}

// DriverResponse is the public representation of a driver.
type DriverResponse struct {
	ID               string  `json:"id"`
	FirstName        string  `json:"first_name"`
	LastName         string  `json:"last_name"`
	LicenseNumber    string  `json:"license_number"`
	Phone            *string `json:"phone,omitempty"`
	LicenseExpiresAt string  `json:"license_expires_at"`
	Status           string  `json:"status"`
}

// ListResponse wraps any paginated list.
type ListResponse[T any] struct {
	Items  []T `json:"items"`
	Total  int `json:"total"`
	Limit  int `json:"limit"`
	Offset int `json:"offset"`
}

// CancellationPolicyRequest is the body for the cancellation policy upsert.
type CancellationPolicyRequest struct {
	RefundPct24h     int `json:"refund_pct_24h"      validate:"min=0,max=100"`
	RefundPct2to24h  int `json:"refund_pct_2_to_24h" validate:"min=0,max=100"`
	RefundPctUnder2h int `json:"refund_pct_under_2h" validate:"min=0,max=100"`
}

// CancellationPolicyResponse is the public representation.
type CancellationPolicyResponse struct {
	RefundPct24h     int    `json:"refund_pct_24h"`
	RefundPct2to24h  int    `json:"refund_pct_2_to_24h"`
	RefundPctUnder2h int    `json:"refund_pct_under_2h"`
	UpdatedAt        string `json:"updated_at"`
}

// BaggagePolicyRequest is the body for the baggage policy upsert.
type BaggagePolicyRequest struct {
	FreeKg              int `json:"free_kg"                  validate:"min=0,max=100"`
	ExtraFeePerKgCents  int `json:"extra_fee_per_kg_cents"   validate:"min=0"`
	MaxKgPerPassenger   int `json:"max_kg_per_passenger"     validate:"min=1,max=200"`
}

// BaggagePolicyResponse is the public representation.
type BaggagePolicyResponse struct {
	FreeKg             int    `json:"free_kg"`
	ExtraFeePerKgCents int    `json:"extra_fee_per_kg_cents"`
	MaxKgPerPassenger  int    `json:"max_kg_per_passenger"`
	UpdatedAt          string `json:"updated_at"`
}

func toProfileResponse(p *domain.Profile) ProfileResponse {
	return ProfileResponse{
		ID:           p.ID.String(),
		Name:         p.Name,
		ContactEmail: p.ContactEmail,
		ContactPhone: p.ContactPhone,
		Address:      p.Address,
	}
}

func toBusResponse(b *domain.Bus) BusResponse {
	amenities := b.Amenities
	if amenities == nil {
		amenities = []string{}
	}
	return BusResponse{
		ID:           b.ID.String(),
		LicensePlate: b.LicensePlate,
		Model:        b.Model,
		Capacity:     b.Capacity,
		Class:        string(b.Class),
		Amenities:    amenities,
		Status:       string(b.Status),
		UpdatedAt:    b.UpdatedAt,
	}
}

func toDriverResponse(d *domain.Driver) DriverResponse {
	return DriverResponse{
		ID:               d.ID.String(),
		FirstName:        d.FirstName,
		LastName:         d.LastName,
		LicenseNumber:    d.LicenseNumber,
		Phone:            d.Phone,
		LicenseExpiresAt: d.LicenseExpiresAt.Format("2006-01-02"),
		Status:           string(d.Status),
	}
}
