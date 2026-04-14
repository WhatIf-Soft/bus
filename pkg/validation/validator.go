package validation

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"

	apperrors "github.com/busexpress/pkg/errors"
)

// Validate is the shared validator instance with custom validators registered.
var Validate *validator.Validate

func init() {
	Validate = validator.New(validator.WithRequiredStructEnabled())
}

// ValidateStruct validates a struct and returns an AppError with
// a human-readable summary of all validation failures.
func ValidateStruct(s interface{}) error {
	if err := Validate.Struct(s); err != nil {
		validationErrors, ok := err.(validator.ValidationErrors)
		if !ok {
			return apperrors.NewValidation(err.Error())
		}

		messages := make([]string, 0, len(validationErrors))
		for _, fe := range validationErrors {
			messages = append(messages, fmt.Sprintf(
				"field '%s' failed on '%s' validation",
				fe.Field(),
				fe.Tag(),
			))
		}

		return apperrors.NewValidation(strings.Join(messages, "; "))
	}
	return nil
}
