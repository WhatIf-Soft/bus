package redis

import (
	"context"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

const unlockScript = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
	return redis.call("DEL", KEYS[1])
else
	return 0
end
`

// Redlock implements the Redlock distributed locking algorithm
// using multiple independent Redis instances.
type Redlock struct {
	clients []*goredis.Client
}

// NewRedlock creates a new Redlock instance with the given Redis clients.
func NewRedlock(clients []*goredis.Client) *Redlock {
	return &Redlock{clients: clients}
}

// Lock attempts to acquire a distributed lock on the given key across
// a quorum of Redis instances (majority required: len/2 + 1).
func (r *Redlock) Lock(ctx context.Context, key string, value string, ttl time.Duration) (bool, error) {
	quorum := len(r.clients)/2 + 1
	start := time.Now()

	acquired := 0
	for _, client := range r.clients {
		ok, err := client.SetNX(ctx, key, value, ttl).Result()
		if err != nil {
			continue
		}
		if ok {
			acquired++
		}
	}

	elapsed := time.Since(start)
	if acquired >= quorum && elapsed < ttl {
		return true, nil
	}

	// Failed to acquire quorum — release all locks
	_ = r.Unlock(ctx, key, value)
	return false, nil
}

// Unlock releases the distributed lock using a Lua script that performs
// an atomic compare-and-delete to avoid releasing locks held by others.
func (r *Redlock) Unlock(ctx context.Context, key string, value string) error {
	for _, client := range r.clients {
		_ = client.Eval(ctx, unlockScript, []string{key}, value).Err()
	}
	return nil
}
