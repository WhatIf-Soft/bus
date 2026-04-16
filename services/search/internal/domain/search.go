package domain

import (
	"time"

	"github.com/google/uuid"
)

// TripStatus represents the lifecycle state of a scheduled trip.
type TripStatus string

const (
	TripScheduled TripStatus = "scheduled"
	TripBoarding  TripStatus = "boarding"
	TripDeparted  TripStatus = "departed"
	TripArrived   TripStatus = "arrived"
	TripCancelled TripStatus = "cancelled"
)

// Operator represents a bus company on the platform.
type Operator struct {
	ID         uuid.UUID
	Name       string
	LogoURL    *string
	Rating     float64
	OnTimeRate float64
}

// Stop represents a named physical location (bus station).
type Stop struct {
	ID        uuid.UUID
	Name      string
	City      string
	Country   string
	Latitude  float64
	Longitude float64
}

// Route represents a directed origin/destination pair served by an operator.
type Route struct {
	ID              uuid.UUID
	OperatorID      uuid.UUID
	OriginStopID    uuid.UUID
	DestinationID   uuid.UUID
	DistanceKm      int
	DurationMinutes int
}

// Trip represents a single scheduled bus departure.
type Trip struct {
	ID             uuid.UUID
	RouteID        uuid.UUID
	OperatorID     uuid.UUID
	DepartureTime  time.Time
	ArrivalTime    time.Time
	PriceCents     int
	Currency       string
	TotalSeats     int
	AvailableSeats int
	BusClass       string
	Amenities      []string
	Status         TripStatus
}

// TripResult joins a trip with its operator and origin/destination stops
// for presentation purposes.
type TripResult struct {
	Trip        Trip
	Operator    Operator
	Origin      Stop
	Destination Stop
}

// SearchCriteria defines the inputs a traveller provides to find trips.
type SearchCriteria struct {
	OriginCity      string
	DestinationCity string
	DepartureDate   time.Time
	Passengers      int
	MaxPriceCents   *int
	BusClass        *string
	SortBy          string // "recommended" | "price" | "duration" | "departure"
	IncludeSoldOut  bool
	Limit           int
	Offset          int
}
