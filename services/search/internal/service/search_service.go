package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/busexpress/services/search/internal/domain"
	"github.com/busexpress/services/search/internal/port"
	"github.com/google/uuid"
)

type searchService struct {
	repo port.SearchRepository
}

// NewSearchService builds a search service backed by the given repository.
func NewSearchService(repo port.SearchRepository) port.SearchService {
	return &searchService{repo: repo}
}

func (s *searchService) SearchTrips(ctx context.Context, c domain.SearchCriteria) ([]domain.TripResult, int, error) {
	if strings.TrimSpace(c.OriginCity) == "" || strings.TrimSpace(c.DestinationCity) == "" {
		return nil, 0, fmt.Errorf("%w: origin and destination required", domain.ErrInvalidCriteria)
	}
	if strings.EqualFold(c.OriginCity, c.DestinationCity) {
		return nil, 0, fmt.Errorf("%w: origin and destination must differ", domain.ErrInvalidCriteria)
	}
	if c.Passengers <= 0 {
		c.Passengers = 1
	}
	if c.Passengers > 9 {
		return nil, 0, fmt.Errorf("%w: max 9 passengers per search", domain.ErrInvalidCriteria)
	}
	if c.DepartureDate.IsZero() {
		return nil, 0, fmt.Errorf("%w: departure date required", domain.ErrInvalidCriteria)
	}
	if c.SortBy == "" {
		c.SortBy = "recommended"
	}
	return s.repo.SearchTrips(ctx, c)
}

func (s *searchService) Autocomplete(ctx context.Context, prefix string) ([]domain.Stop, error) {
	prefix = strings.TrimSpace(prefix)
	if len(prefix) < 2 {
		return []domain.Stop{}, nil
	}
	return s.repo.AutocompleteStops(ctx, prefix, 10)
}

func (s *searchService) GetTrip(ctx context.Context, id uuid.UUID) (*domain.TripResult, error) {
	return s.repo.GetTripByID(ctx, id)
}
