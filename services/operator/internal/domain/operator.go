package domain

import (
	"time"

	"github.com/google/uuid"
)

// Profile is an operator's company-level profile, owned by one user.
type Profile struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	Name         string
	ContactEmail *string
	ContactPhone *string
	Address      *string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// BusClass is the comfort tier of a bus.
type BusClass string

const (
	BusStandard BusClass = "standard"
	BusVIP      BusClass = "vip"
	BusSleeper  BusClass = "sleeper"
)

// BusStatus is the operational state of a bus.
type BusStatus string

const (
	BusActive      BusStatus = "active"
	BusMaintenance BusStatus = "maintenance"
	BusRetired     BusStatus = "retired"
)

// Bus is one vehicle in an operator's fleet.
type Bus struct {
	ID           uuid.UUID
	OperatorID   uuid.UUID
	LicensePlate string
	Model        string
	Capacity     int
	Class        BusClass
	Amenities    []string
	Status       BusStatus
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// DriverStatus is the employment state of a driver.
type DriverStatus string

const (
	DriverActive    DriverStatus = "active"
	DriverOnLeave   DriverStatus = "on_leave"
	DriverSuspended DriverStatus = "suspended"
	DriverFormer    DriverStatus = "former"
)

// Driver is one driver employed by an operator.
type Driver struct {
	ID               uuid.UUID
	OperatorID       uuid.UUID
	FirstName        string
	LastName         string
	LicenseNumber    string
	Phone            *string
	LicenseExpiresAt time.Time
	Status           DriverStatus
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

// CancellationPolicy holds refund percentages per time-to-departure tier
// (CLAUDE.md §7.2).
type CancellationPolicy struct {
	OperatorID         uuid.UUID
	RefundPct24h       int
	RefundPct2to24h    int
	RefundPctUnder2h   int
	UpdatedAt          time.Time
}

// BaggagePolicy holds baggage allowance + overage pricing (CLAUDE.md §10).
type BaggagePolicy struct {
	OperatorID          uuid.UUID
	FreeKg              int
	ExtraFeePerKgCents  int
	MaxKgPerPassenger   int
	UpdatedAt           time.Time
}
