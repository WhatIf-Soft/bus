package domain

// allowedTransitions encodes the booking state machine described in
// CLAUDE.md §4.3. Any transition not listed here is rejected.
var allowedTransitions = map[Status]map[Status]struct{}{
	StatusPendingSeat: {
		StatusPendingPayment: {},
		StatusExpired:        {},
		StatusCancelled:      {},
	},
	StatusPendingPayment: {
		StatusConfirmed:  {},
		StatusFailed:     {},
		StatusExpired:    {},
		StatusCancelled:  {},
	},
	StatusFailed: {
		StatusPendingSeat: {},
		StatusExpired:     {},
		StatusCancelled:   {},
	},
	StatusConfirmed: {
		StatusUsed:               {},
		StatusCancelled:          {},
		StatusDisputed:           {},
		StatusPartiallyCancelled: {},
	},
	StatusCancelled: {
		StatusRefunded: {},
	},
	StatusPartiallyCancelled: {
		StatusPartiallyRefunded: {},
	},
	StatusDisputed: {
		StatusConfirmed: {},
		StatusRefunded:  {},
	},
}

// CanTransition reports whether moving from `from` to `to` is allowed.
func CanTransition(from, to Status) bool {
	dests, ok := allowedTransitions[from]
	if !ok {
		return false
	}
	_, ok = dests[to]
	return ok
}

// Transition validates a state change, returning ErrInvalidTransition if not allowed.
func Transition(from, to Status) error {
	if !CanTransition(from, to) {
		return ErrInvalidTransition
	}
	return nil
}
