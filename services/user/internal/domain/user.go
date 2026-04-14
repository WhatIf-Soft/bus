package domain

import (
	"time"

	"github.com/google/uuid"
)

// UserRole represents the role of a user in the system.
type UserRole string

const (
	RoleVoyageur     UserRole = "voyageur"
	RoleOperateur    UserRole = "operateur"
	RoleAgentSupport UserRole = "agent_support"
	RoleAdmin        UserRole = "admin"
)

// UserStatus represents the account status of a user.
type UserStatus string

const (
	StatusActive    UserStatus = "active"
	StatusSuspended UserStatus = "suspended"
	StatusDeleted   UserStatus = "deleted"
)

// User represents a registered user in the BusExpress platform.
type User struct {
	ID               uuid.UUID
	Email            string
	Phone            *string
	PasswordHash     string
	Role             UserRole
	Status           UserStatus
	TwoFactorEnabled bool
	TwoFactorSecret  *string
	GuestToken       *string
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

// Session represents an active user session on a specific device.
type Session struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	DeviceInfo   string
	IPAddress    string
	CreatedAt    time.Time
	LastActiveAt time.Time
	RevokedAt    *time.Time
}

// SavedPassenger represents a passenger profile saved by a user
// for quick booking.
type SavedPassenger struct {
	ID             uuid.UUID
	UserID         uuid.UUID
	FirstName      string
	LastName       string
	DateOfBirth    *time.Time
	DocumentNumber *string
	CreatedAt      time.Time
}
