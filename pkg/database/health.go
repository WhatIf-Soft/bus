package database

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// CheckHealth verifies the database connection by pinging it.
func CheckHealth(ctx context.Context, pool *pgxpool.Pool) error {
	return pool.Ping(ctx)
}
