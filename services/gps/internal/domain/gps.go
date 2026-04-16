package domain

import (
	"time"

	"github.com/google/uuid"
)

// TrackingStatus represents the lifecycle of a GPS tracking session.
type TrackingStatus string

const (
	StatusActive       TrackingStatus = "active"
	StatusCompleted    TrackingStatus = "completed"
	StatusDisconnected TrackingStatus = "disconnected"
)

// TripTracking holds the latest known position for a tracked trip.
type TripTracking struct {
	ID            uuid.UUID
	TripID        uuid.UUID
	BusID         *uuid.UUID
	DriverID      *uuid.UUID
	Status        TrackingStatus
	LastLat       *float64
	LastLng       *float64
	LastSpeedKmh  *float64
	LastUpdatedAt *time.Time
	StartedAt     time.Time
	CompletedAt   *time.Time
}

// PositionUpdate is an inbound GPS ping from a driver device.
type PositionUpdate struct {
	TripID   uuid.UUID
	Lat      float64
	Lng      float64
	SpeedKmh float64
	Time     time.Time
}
