package testutil

import (
	"context"
)

// StartPostgres spins up a PostgreSQL container for integration tests.
// Returns the DSN connection string and a cleanup function.
func StartPostgres(ctx context.Context) (dsn string, cleanup func(), err error) {
	// TODO: Implement using testcontainers-go.
	//
	// Example implementation:
	//   req := testcontainers.ContainerRequest{
	//       Image:        "postgres:16-alpine",
	//       ExposedPorts: []string{"5432/tcp"},
	//       Env:          map[string]string{"POSTGRES_PASSWORD": "test", "POSTGRES_DB": "busexpress_test"},
	//       WaitingFor:   wait.ForListeningPort("5432/tcp"),
	//   }
	//   container, _ := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{...})
	//   host, _ := container.Host(ctx)
	//   port, _ := container.MappedPort(ctx, "5432")
	//   dsn = fmt.Sprintf("postgres://postgres:test@%s:%s/busexpress_test?sslmode=disable", host, port.Port())
	//   cleanup = func() { container.Terminate(ctx) }
	panic("testcontainers: StartPostgres not yet implemented — add testcontainers-go dependency")
}

// StartRedis spins up a Redis container for integration tests.
// Returns the address and a cleanup function.
func StartRedis(ctx context.Context) (addr string, cleanup func(), err error) {
	// TODO: Implement using testcontainers-go.
	//
	// Example implementation:
	//   req := testcontainers.ContainerRequest{
	//       Image:        "redis:7-alpine",
	//       ExposedPorts: []string{"6379/tcp"},
	//       WaitingFor:   wait.ForListeningPort("6379/tcp"),
	//   }
	//   container, _ := testcontainers.GenericContainer(ctx, ...)
	//   host, _ := container.Host(ctx)
	//   port, _ := container.MappedPort(ctx, "6379")
	//   addr = fmt.Sprintf("%s:%s", host, port.Port())
	//   cleanup = func() { container.Terminate(ctx) }
	panic("testcontainers: StartRedis not yet implemented — add testcontainers-go dependency")
}

// StartKafka spins up a Kafka container for integration tests.
// Returns the broker address and a cleanup function.
func StartKafka(ctx context.Context) (broker string, cleanup func(), err error) {
	// TODO: Implement using testcontainers-go.
	//
	// Example implementation:
	//   Use the Redpanda or Confluent Kafka image with testcontainers-go.
	//   Return the broker address and termination cleanup function.
	panic("testcontainers: StartKafka not yet implemented — add testcontainers-go dependency")
}
