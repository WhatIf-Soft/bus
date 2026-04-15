package port

import (
	"context"

	"github.com/busexpress/services/operator/internal/domain"
	"github.com/google/uuid"
)

// CreateProfileRequest is the input for creating an operator profile.
type CreateProfileRequest struct {
	UserID       uuid.UUID
	Name         string
	ContactEmail *string
	ContactPhone *string
	Address      *string
}

// UpdateProfileRequest patches non-identity fields on a profile.
type UpdateProfileRequest struct {
	Name         *string
	ContactEmail *string
	ContactPhone *string
	Address      *string
}

// CreateBusRequest is the input for adding a bus.
type CreateBusRequest struct {
	LicensePlate string
	Model        string
	Capacity     int
	Class        domain.BusClass
	Amenities    []string
}

// UpdateBusRequest patches a bus.
type UpdateBusRequest struct {
	Model     *string
	Capacity  *int
	Class     *domain.BusClass
	Amenities *[]string
	Status    *domain.BusStatus
}

// CreateDriverRequest is the input for adding a driver.
type CreateDriverRequest struct {
	FirstName        string
	LastName         string
	LicenseNumber    string
	Phone            *string
	LicenseExpiresAt string // YYYY-MM-DD
}

// UpdateDriverRequest patches a driver.
type UpdateDriverRequest struct {
	FirstName        *string
	LastName         *string
	LicenseNumber    *string
	Phone            *string
	LicenseExpiresAt *string
	Status           *domain.DriverStatus
}

// OperatorService is the application API used by HTTP handlers.
type OperatorService interface {
	GetOrCreateProfile(ctx context.Context, userID uuid.UUID, defaultName string) (*domain.Profile, error)
	UpdateProfile(ctx context.Context, userID uuid.UUID, req UpdateProfileRequest) (*domain.Profile, error)

	CreateBus(ctx context.Context, userID uuid.UUID, req CreateBusRequest) (*domain.Bus, error)
	ListBuses(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Bus, int, error)
	UpdateBus(ctx context.Context, userID uuid.UUID, busID uuid.UUID, req UpdateBusRequest) (*domain.Bus, error)
	DeleteBus(ctx context.Context, userID, busID uuid.UUID) error

	CreateDriver(ctx context.Context, userID uuid.UUID, req CreateDriverRequest) (*domain.Driver, error)
	ListDrivers(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Driver, int, error)
	UpdateDriver(ctx context.Context, userID uuid.UUID, driverID uuid.UUID, req UpdateDriverRequest) (*domain.Driver, error)
	DeleteDriver(ctx context.Context, userID, driverID uuid.UUID) error

	GetCancellationPolicy(ctx context.Context, userID uuid.UUID) (*domain.CancellationPolicy, error)
	UpsertCancellationPolicy(ctx context.Context, userID uuid.UUID, p domain.CancellationPolicy) (*domain.CancellationPolicy, error)
	GetBaggagePolicy(ctx context.Context, userID uuid.UUID) (*domain.BaggagePolicy, error)
	UpsertBaggagePolicy(ctx context.Context, userID uuid.UUID, p domain.BaggagePolicy) (*domain.BaggagePolicy, error)
}
