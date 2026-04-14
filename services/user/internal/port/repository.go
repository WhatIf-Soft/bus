package port

import (
	"context"

	"github.com/google/uuid"

	"github.com/busexpress/services/user/internal/domain"
)

// UserRepository defines the data access contract for user persistence.
type UserRepository interface {
	Create(ctx context.Context, user domain.User) (domain.User, error)
	FindByID(ctx context.Context, id uuid.UUID) (domain.User, error)
	FindByEmail(ctx context.Context, email string) (domain.User, error)
	Update(ctx context.Context, user domain.User) (domain.User, error)
	Delete(ctx context.Context, id uuid.UUID) error
	CreateSession(ctx context.Context, session domain.Session) (domain.Session, error)
	FindSessionByID(ctx context.Context, id uuid.UUID) (domain.Session, error)
	ListSessions(ctx context.Context, userID uuid.UUID) ([]domain.Session, error)
	RevokeSession(ctx context.Context, sessionID uuid.UUID) error
	RevokeAllSessions(ctx context.Context, userID uuid.UUID) error
}

// SavedPassengerRepository defines the data access contract for saved passengers.
type SavedPassengerRepository interface {
	Create(ctx context.Context, passenger domain.SavedPassenger) (domain.SavedPassenger, error)
	FindByID(ctx context.Context, id uuid.UUID) (domain.SavedPassenger, error)
	FindByUserID(ctx context.Context, userID uuid.UUID) ([]domain.SavedPassenger, error)
	CountByUserID(ctx context.Context, userID uuid.UUID) (int, error)
	Update(ctx context.Context, passenger domain.SavedPassenger) (domain.SavedPassenger, error)
	Delete(ctx context.Context, id uuid.UUID) error
}
