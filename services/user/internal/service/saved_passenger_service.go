package service

import (
	"errors"
	"fmt"
	"time"

	"context"

	"github.com/google/uuid"

	"github.com/busexpress/services/user/internal/adapter/outbound/postgres"
	"github.com/busexpress/services/user/internal/domain"
)

// maxSavedPassengers enforces SF-USR-06 (max 10 recurring profiles).
const maxSavedPassengers = 10

func (s *userService) ListSavedPassengers(ctx context.Context, userID uuid.UUID) ([]domain.SavedPassenger, error) {
	passengers, err := s.passengerRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list saved passengers: %w", err)
	}
	return passengers, nil
}

func (s *userService) CreateSavedPassenger(
	ctx context.Context,
	userID uuid.UUID,
	firstName, lastName string,
	dob *time.Time,
	documentNumber *string,
) (domain.SavedPassenger, error) {
	count, err := s.passengerRepo.CountByUserID(ctx, userID)
	if err != nil {
		return domain.SavedPassenger{}, fmt.Errorf("create saved passenger: %w", err)
	}
	if count >= maxSavedPassengers {
		return domain.SavedPassenger{}, domain.ErrMaxSavedPassengers
	}

	created, err := s.passengerRepo.Create(ctx, domain.SavedPassenger{
		UserID:         userID,
		FirstName:      firstName,
		LastName:       lastName,
		DateOfBirth:    dob,
		DocumentNumber: documentNumber,
	})
	if err != nil {
		return domain.SavedPassenger{}, fmt.Errorf("create saved passenger: %w", err)
	}

	return created, nil
}

func (s *userService) UpdateSavedPassenger(
	ctx context.Context,
	userID uuid.UUID,
	passengerID uuid.UUID,
	firstName, lastName string,
	dob *time.Time,
	documentNumber *string,
) (domain.SavedPassenger, error) {
	existing, err := s.passengerRepo.FindByID(ctx, passengerID)
	if err != nil {
		if errors.Is(err, postgres.ErrPassengerNotFound) {
			return domain.SavedPassenger{}, postgres.ErrPassengerNotFound
		}
		return domain.SavedPassenger{}, fmt.Errorf("update saved passenger: %w", err)
	}

	if existing.UserID != userID {
		return domain.SavedPassenger{}, domain.ErrNotAuthorized
	}

	existing.FirstName = firstName
	existing.LastName = lastName
	existing.DateOfBirth = dob
	existing.DocumentNumber = documentNumber

	updated, err := s.passengerRepo.Update(ctx, existing)
	if err != nil {
		return domain.SavedPassenger{}, fmt.Errorf("update saved passenger: %w", err)
	}

	return updated, nil
}

func (s *userService) DeleteSavedPassenger(ctx context.Context, userID uuid.UUID, passengerID uuid.UUID) error {
	existing, err := s.passengerRepo.FindByID(ctx, passengerID)
	if err != nil {
		return fmt.Errorf("delete saved passenger: %w", err)
	}

	if existing.UserID != userID {
		return domain.ErrNotAuthorized
	}

	if err := s.passengerRepo.Delete(ctx, passengerID); err != nil {
		return fmt.Errorf("delete saved passenger: %w", err)
	}

	return nil
}
