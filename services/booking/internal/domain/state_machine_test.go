package domain

import "testing"

func TestCanTransition(t *testing.T) {
	cases := []struct {
		name string
		from Status
		to   Status
		ok   bool
	}{
		{"hold to payment", StatusPendingSeat, StatusPendingPayment, true},
		{"hold to expired", StatusPendingSeat, StatusExpired, true},
		{"hold to confirmed (skip payment)", StatusPendingSeat, StatusConfirmed, false},
		{"payment to confirmed", StatusPendingPayment, StatusConfirmed, true},
		{"payment to failed", StatusPendingPayment, StatusFailed, true},
		{"failed retry", StatusFailed, StatusPendingSeat, true},
		{"confirmed to used", StatusConfirmed, StatusUsed, true},
		{"confirmed to refunded directly", StatusConfirmed, StatusRefunded, false},
		{"cancelled to refunded", StatusCancelled, StatusRefunded, true},
		{"used is terminal", StatusUsed, StatusCancelled, false},
		{"expired is terminal", StatusExpired, StatusPendingSeat, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := CanTransition(tc.from, tc.to)
			if got != tc.ok {
				t.Fatalf("CanTransition(%s,%s) = %v, want %v", tc.from, tc.to, got, tc.ok)
			}
		})
	}
}
