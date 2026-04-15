package domain

import (
	"time"

	"github.com/google/uuid"
)

// Status is the lifecycle state of a support ticket.
type Status string

const (
	StatusOpen              Status = "open"
	StatusInProgress        Status = "in_progress"
	StatusAwaitingCustomer  Status = "awaiting_customer"
	StatusResolved          Status = "resolved"
	StatusClosed            Status = "closed"
)

// Priority is the urgency level of a ticket.
type Priority string

const (
	PriorityLow    Priority = "low"
	PriorityNormal Priority = "normal"
	PriorityHigh   Priority = "high"
	PriorityUrgent Priority = "urgent"
)

// Category groups tickets by topic for routing.
type Category string

const (
	CategoryBooking  Category = "booking"
	CategoryPayment  Category = "payment"
	CategoryRefund   Category = "refund"
	CategoryAccount  Category = "account"
	CategoryBaggage  Category = "baggage"
	CategoryIncident Category = "incident"
	CategoryOther    Category = "other"
)

// AuthorRole identifies who wrote a ticket message.
type AuthorRole string

const (
	AuthorUser   AuthorRole = "user"
	AuthorAgent  AuthorRole = "agent"
	AuthorSystem AuthorRole = "system"
)

// Ticket is the aggregate root for a support conversation.
type Ticket struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	Subject         string
	Category        Category
	Priority        Priority
	Status          Status
	BookingID       *uuid.UUID
	AssignedAgentID *uuid.UUID
	CreatedAt       time.Time
	UpdatedAt       time.Time
	ClosedAt        *time.Time
	Messages        []Message
}

// Message is one entry in a ticket's thread.
type Message struct {
	ID         uuid.UUID
	TicketID   uuid.UUID
	AuthorRole AuthorRole
	AuthorID   uuid.UUID
	Body       string
	CreatedAt  time.Time
}
