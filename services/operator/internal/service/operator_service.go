package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"github.com/busexpress/services/operator/internal/domain"
	"github.com/busexpress/services/operator/internal/port"
)

type operatorService struct {
	profiles port.ProfileRepository
	buses    port.BusRepository
	drivers  port.DriverRepository
	policies port.PolicyRepository
}

// NewOperatorService wires the operator application service.
func NewOperatorService(profiles port.ProfileRepository, buses port.BusRepository, drivers port.DriverRepository, policies port.PolicyRepository) port.OperatorService {
	return &operatorService{profiles: profiles, buses: buses, drivers: drivers, policies: policies}
}

func (s *operatorService) GetOrCreateProfile(ctx context.Context, userID uuid.UUID, defaultName string) (*domain.Profile, error) {
	p, err := s.profiles.GetByUser(ctx, userID)
	if err == nil {
		return p, nil
	}
	if !errors.Is(err, domain.ErrProfileNotFound) {
		return nil, err
	}
	now := time.Now().UTC()
	if defaultName == "" {
		defaultName = "Mon entreprise"
	}
	p = &domain.Profile{
		ID: uuid.New(), UserID: userID, Name: defaultName,
		CreatedAt: now, UpdatedAt: now,
	}
	if err := s.profiles.Create(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *operatorService) profileForUser(ctx context.Context, userID uuid.UUID) (*domain.Profile, error) {
	return s.profiles.GetByUser(ctx, userID)
}

func (s *operatorService) UpdateProfile(ctx context.Context, userID uuid.UUID, req port.UpdateProfileRequest) (*domain.Profile, error) {
	p, err := s.profileForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if req.Name != nil {
		p.Name = *req.Name
	}
	if req.ContactEmail != nil {
		p.ContactEmail = req.ContactEmail
	}
	if req.ContactPhone != nil {
		p.ContactPhone = req.ContactPhone
	}
	if req.Address != nil {
		p.Address = req.Address
	}
	if err := s.profiles.Update(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *operatorService) CreateBus(ctx context.Context, userID uuid.UUID, req port.CreateBusRequest) (*domain.Bus, error) {
	p, err := s.profileForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	b := &domain.Bus{
		ID: uuid.New(), OperatorID: p.ID,
		LicensePlate: req.LicensePlate, Model: req.Model, Capacity: req.Capacity,
		Class: req.Class, Amenities: req.Amenities, Status: domain.BusActive,
		CreatedAt: now, UpdatedAt: now,
	}
	if err := s.buses.Create(ctx, b); err != nil {
		return nil, err
	}
	return b, nil
}

func (s *operatorService) ListBuses(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Bus, int, error) {
	p, err := s.profileForUser(ctx, userID)
	if err != nil {
		return nil, 0, err
	}
	return s.buses.ListByOperator(ctx, p.ID, limit, offset)
}

func (s *operatorService) UpdateBus(ctx context.Context, userID, busID uuid.UUID, req port.UpdateBusRequest) (*domain.Bus, error) {
	p, err := s.profileForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	b, err := s.buses.GetByID(ctx, busID)
	if err != nil {
		return nil, err
	}
	if b.OperatorID != p.ID {
		return nil, domain.ErrNotOwner
	}
	if req.Model != nil {
		b.Model = *req.Model
	}
	if req.Capacity != nil {
		b.Capacity = *req.Capacity
	}
	if req.Class != nil {
		b.Class = *req.Class
	}
	if req.Amenities != nil {
		b.Amenities = *req.Amenities
	}
	if req.Status != nil {
		b.Status = *req.Status
	}
	if err := s.buses.Update(ctx, b); err != nil {
		return nil, err
	}
	return b, nil
}

func (s *operatorService) DeleteBus(ctx context.Context, userID, busID uuid.UUID) error {
	p, err := s.profileForUser(ctx, userID)
	if err != nil {
		return err
	}
	b, err := s.buses.GetByID(ctx, busID)
	if err != nil {
		return err
	}
	if b.OperatorID != p.ID {
		return domain.ErrNotOwner
	}
	return s.buses.Delete(ctx, busID)
}

func (s *operatorService) CreateDriver(ctx context.Context, userID uuid.UUID, req port.CreateDriverRequest) (*domain.Driver, error) {
	p, err := s.profileForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	exp, err := time.Parse("2006-01-02", req.LicenseExpiresAt)
	if err != nil {
		return nil, domain.ErrInvalidPolicy
	}
	now := time.Now().UTC()
	d := &domain.Driver{
		ID: uuid.New(), OperatorID: p.ID,
		FirstName: req.FirstName, LastName: req.LastName,
		LicenseNumber: req.LicenseNumber, Phone: req.Phone,
		LicenseExpiresAt: exp, Status: domain.DriverActive,
		CreatedAt: now, UpdatedAt: now,
	}
	if err := s.drivers.Create(ctx, d); err != nil {
		return nil, err
	}
	return d, nil
}

func (s *operatorService) ListDrivers(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Driver, int, error) {
	p, err := s.profileForUser(ctx, userID)
	if err != nil {
		return nil, 0, err
	}
	return s.drivers.ListByOperator(ctx, p.ID, limit, offset)
}

func (s *operatorService) UpdateDriver(ctx context.Context, userID, driverID uuid.UUID, req port.UpdateDriverRequest) (*domain.Driver, error) {
	p, err := s.profileForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	d, err := s.drivers.GetByID(ctx, driverID)
	if err != nil {
		return nil, err
	}
	if d.OperatorID != p.ID {
		return nil, domain.ErrNotOwner
	}
	if req.FirstName != nil {
		d.FirstName = *req.FirstName
	}
	if req.LastName != nil {
		d.LastName = *req.LastName
	}
	if req.LicenseNumber != nil {
		d.LicenseNumber = *req.LicenseNumber
	}
	if req.Phone != nil {
		d.Phone = req.Phone
	}
	if req.LicenseExpiresAt != nil {
		exp, err := time.Parse("2006-01-02", *req.LicenseExpiresAt)
		if err != nil {
			return nil, domain.ErrInvalidPolicy
		}
		d.LicenseExpiresAt = exp
	}
	if req.Status != nil {
		d.Status = *req.Status
	}
	if err := s.drivers.Update(ctx, d); err != nil {
		return nil, err
	}
	return d, nil
}

func (s *operatorService) DeleteDriver(ctx context.Context, userID, driverID uuid.UUID) error {
	p, err := s.profileForUser(ctx, userID)
	if err != nil {
		return err
	}
	d, err := s.drivers.GetByID(ctx, driverID)
	if err != nil {
		return err
	}
	if d.OperatorID != p.ID {
		return domain.ErrNotOwner
	}
	return s.drivers.Delete(ctx, driverID)
}

func (s *operatorService) GetCancellationPolicy(ctx context.Context, userID uuid.UUID) (*domain.CancellationPolicy, error) {
	p, err := s.profileForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	return s.policies.GetCancellation(ctx, p.ID)
}

func (s *operatorService) UpsertCancellationPolicy(ctx context.Context, userID uuid.UUID, in domain.CancellationPolicy) (*domain.CancellationPolicy, error) {
	p, err := s.profileForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if in.RefundPct24h < 0 || in.RefundPct24h > 100 ||
		in.RefundPct2to24h < 0 || in.RefundPct2to24h > 100 ||
		in.RefundPctUnder2h < 0 || in.RefundPctUnder2h > 100 {
		return nil, domain.ErrInvalidPolicy
	}
	in.OperatorID = p.ID
	if err := s.policies.UpsertCancellation(ctx, &in); err != nil {
		return nil, err
	}
	return s.policies.GetCancellation(ctx, p.ID)
}

func (s *operatorService) GetBaggagePolicy(ctx context.Context, userID uuid.UUID) (*domain.BaggagePolicy, error) {
	p, err := s.profileForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	return s.policies.GetBaggage(ctx, p.ID)
}

func (s *operatorService) UpsertBaggagePolicy(ctx context.Context, userID uuid.UUID, in domain.BaggagePolicy) (*domain.BaggagePolicy, error) {
	p, err := s.profileForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if in.FreeKg < 0 || in.MaxKgPerPassenger <= 0 || in.ExtraFeePerKgCents < 0 {
		return nil, domain.ErrInvalidPolicy
	}
	in.OperatorID = p.ID
	if err := s.policies.UpsertBaggage(ctx, &in); err != nil {
		return nil, err
	}
	return s.policies.GetBaggage(ctx, p.ID)
}
