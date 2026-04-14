package testutil

import (
	"fmt"
	"math/rand"

	"github.com/google/uuid"
)

// RandomUUID returns a new random UUID string.
func RandomUUID() string {
	return uuid.New().String()
}

// RandomEmail returns a random email address for testing.
func RandomEmail() string {
	return fmt.Sprintf("test-%s@busexpress-test.com", uuid.New().String()[:8])
}

// RandomPhone returns a random phone number in E.164 format for testing.
func RandomPhone() string {
	return fmt.Sprintf("+225%010d", rand.Int63n(10_000_000_000))
}
