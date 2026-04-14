package service_test

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/busexpress/services/user/internal/service"
)

func TestNewUserService(t *testing.T) {
	tests := []struct {
		name string
	}{
		{
			name: "creates service with nil repositories",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := service.NewUserService(nil, nil)
			assert.NotNil(t, svc, "NewUserService should return a non-nil service")
		})
	}
}
