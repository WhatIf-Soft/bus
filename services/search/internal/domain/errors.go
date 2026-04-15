package domain

import "errors"

var (
	ErrInvalidCriteria = errors.New("invalid search criteria")
	ErrNotFound        = errors.New("not found")
)
