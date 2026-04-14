package redis

import (
	goredis "github.com/redis/go-redis/v9"
)

// NewClient creates a single Redis client for the given address.
func NewClient(addr string) *goredis.Client {
	return goredis.NewClient(&goredis.Options{
		Addr: addr,
	})
}

// NewClients creates multiple Redis clients, one per address.
// Used for Redlock distributed locking with independent Redis instances.
func NewClients(addrs []string) []*goredis.Client {
	clients := make([]*goredis.Client, len(addrs))
	for i, addr := range addrs {
		clients[i] = NewClient(addr)
	}
	return clients
}
