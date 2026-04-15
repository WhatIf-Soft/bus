package http

import (
	"time"

	"github.com/busexpress/services/search/internal/domain"
)

// TripResponse is the public representation of a trip result.
type TripResponse struct {
	ID              string    `json:"id"`
	RouteID         string    `json:"route_id"`
	DepartureTime   time.Time `json:"departure_time"`
	ArrivalTime     time.Time `json:"arrival_time"`
	DurationMinutes int       `json:"duration_minutes"`
	PriceCents      int       `json:"price_cents"`
	Currency        string    `json:"currency"`
	AvailableSeats  int       `json:"available_seats"`
	BusClass        string    `json:"bus_class"`
	Amenities       []string  `json:"amenities"`
	Operator        OperatorResponse `json:"operator"`
	Origin          StopResponse     `json:"origin"`
	Destination     StopResponse     `json:"destination"`
}

// OperatorResponse is the public representation of an operator.
type OperatorResponse struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	LogoURL    *string `json:"logo_url,omitempty"`
	Rating     float64 `json:"rating"`
	OnTimeRate float64 `json:"on_time_rate"`
}

// StopResponse is the public representation of a stop.
type StopResponse struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	City      string  `json:"city"`
	Country   string  `json:"country"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// SearchTripsResponse wraps a paginated list of trips.
type SearchTripsResponse struct {
	Trips []TripResponse `json:"trips"`
	Total int            `json:"total"`
	Limit int            `json:"limit"`
	Offset int           `json:"offset"`
}

// AutocompleteResponse is the payload for stop suggestions.
type AutocompleteResponse struct {
	Suggestions []StopResponse `json:"suggestions"`
}

func toTripResponse(t domain.TripResult) TripResponse {
	amenities := t.Trip.Amenities
	if amenities == nil {
		amenities = []string{}
	}
	return TripResponse{
		ID:              t.Trip.ID.String(),
		RouteID:         t.Trip.RouteID.String(),
		DepartureTime:   t.Trip.DepartureTime,
		ArrivalTime:     t.Trip.ArrivalTime,
		DurationMinutes: int(t.Trip.ArrivalTime.Sub(t.Trip.DepartureTime).Minutes()),
		PriceCents:      t.Trip.PriceCents,
		Currency:        t.Trip.Currency,
		AvailableSeats:  t.Trip.AvailableSeats,
		BusClass:        t.Trip.BusClass,
		Amenities:       amenities,
		Operator:        toOperatorResponse(t.Operator),
		Origin:          toStopResponse(t.Origin),
		Destination:     toStopResponse(t.Destination),
	}
}

func toOperatorResponse(o domain.Operator) OperatorResponse {
	return OperatorResponse{
		ID:         o.ID.String(),
		Name:       o.Name,
		LogoURL:    o.LogoURL,
		Rating:     o.Rating,
		OnTimeRate: o.OnTimeRate,
	}
}

func toStopResponse(s domain.Stop) StopResponse {
	return StopResponse{
		ID:        s.ID.String(),
		Name:      s.Name,
		City:      s.City,
		Country:   s.Country,
		Latitude:  s.Latitude,
		Longitude: s.Longitude,
	}
}
