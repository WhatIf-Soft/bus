package domain

import "errors"

var (
	ErrProfileNotFound      = errors.New("operator profile not found")
	ErrProfileExists        = errors.New("operator profile already exists for this user")
	ErrBusNotFound          = errors.New("bus not found")
	ErrDriverNotFound       = errors.New("driver not found")
	ErrNotOwner             = errors.New("resource does not belong to this operator")
	ErrLicensePlateConflict = errors.New("license plate already in use")
	ErrLicenseNumberConflict = errors.New("driver license number already in use")
	ErrInvalidPolicy        = errors.New("invalid policy values")
)
