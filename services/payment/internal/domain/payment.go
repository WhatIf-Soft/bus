package domain

import (
	"time"

	"github.com/google/uuid"
)

// Status represents the lifecycle state of a payment.
type Status string

const (
	StatusPending    Status = "pending"
	StatusProcessing Status = "processing"
	StatusSucceeded  Status = "succeeded"
	StatusFailed     Status = "failed"
	StatusCancelled  Status = "cancelled"
	StatusRefunded   Status = "refunded"
)

// Method represents the payment provider channel.
type Method string

const (
	MethodCard        Method = "card"
	MethodOrangeMoney Method = "orange_money"
	MethodWave        Method = "wave"
	MethodMTNMoMo     Method = "mtn_momo"
	MethodMoovMoney   Method = "moov_money"
)

// Payment is the aggregate root for a payment attempt.
type Payment struct {
	ID            uuid.UUID
	BookingID     uuid.UUID
	UserID        uuid.UUID
	AmountCents   int
	Currency      string
	Method        Method
	Status        Status
	ExternalRef   *string
	FailureReason *string
	MSISDN        *string
	CreatedAt     time.Time
	UpdatedAt     time.Time
	CompletedAt   *time.Time
}

// IsTerminal reports whether the payment is in a final state.
func (s Status) IsTerminal() bool {
	switch s {
	case StatusSucceeded, StatusFailed, StatusCancelled, StatusRefunded:
		return true
	}
	return false
}

// IsMobileMoney reports whether the method requires async webhook confirmation.
func (m Method) IsMobileMoney() bool {
	return m == MethodOrangeMoney || m == MethodWave || m == MethodMTNMoMo || m == MethodMoovMoney
}
