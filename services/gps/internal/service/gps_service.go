package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/busexpress/services/gps/internal/domain"
	"github.com/busexpress/services/gps/internal/port"
)

type gpsService struct {
	repo port.TrackingRepository
}

// NewGPSService wires the GPS application service.
func NewGPSService(repo port.TrackingRepository) port.GPSService {
	return &gpsService{repo: repo}
}

func (s *gpsService) StartTracking(ctx context.Context, tripID uuid.UUID, busID, driverID *uuid.UUID) (*domain.TripTracking, error) {
	t := &domain.TripTracking{
		ID:        uuid.New(),
		TripID:    tripID,
		BusID:     busID,
		DriverID:  driverID,
		Status:    domain.StatusActive,
		StartedAt: time.Now().UTC(),
	}
	if err := s.repo.Upsert(ctx, t); err != nil {
		return nil, err
	}
	return s.repo.GetByTrip(ctx, tripID)
}

func (s *gpsService) UpdatePosition(ctx context.Context, upd domain.PositionUpdate) error {
	if upd.Time.IsZero() {
		upd.Time = time.Now().UTC()
	}
	return s.repo.UpdatePosition(ctx, upd)
}

func (s *gpsService) GetPosition(ctx context.Context, tripID uuid.UUID) (*domain.TripTracking, error) {
	return s.repo.GetByTrip(ctx, tripID)
}

func (s *gpsService) Complete(ctx context.Context, tripID uuid.UUID) error {
	return s.repo.Complete(ctx, tripID)
}
