package idempotency

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

const keyPrefix = "idempotency:"

// CachedResponse stores a previously computed response for replay.
type CachedResponse struct {
	StatusCode int    `json:"status_code"`
	Body       []byte `json:"body"`
}

// Store manages idempotency keys in Redis.
type Store struct {
	client *goredis.Client
}

// NewStore creates a new idempotency Store backed by the given Redis client.
func NewStore(client *goredis.Client) *Store {
	return &Store{client: client}
}

// Get retrieves a cached response for the given idempotency key.
// Returns the response, a boolean indicating if found, and any error.
func (s *Store) Get(ctx context.Context, key string) (*CachedResponse, bool, error) {
	data, err := s.client.Get(ctx, keyPrefix+key).Bytes()
	if err != nil {
		if err == goredis.Nil {
			return nil, false, nil
		}
		return nil, false, fmt.Errorf("get idempotency key: %w", err)
	}

	var cached CachedResponse
	if err := json.Unmarshal(data, &cached); err != nil {
		return nil, false, fmt.Errorf("unmarshal cached response: %w", err)
	}

	return &cached, true, nil
}

// Set stores a response for the given idempotency key with the specified TTL.
func (s *Store) Set(ctx context.Context, key string, resp *CachedResponse, ttl time.Duration) error {
	data, err := json.Marshal(resp)
	if err != nil {
		return fmt.Errorf("marshal cached response: %w", err)
	}

	return s.client.Set(ctx, keyPrefix+key, data, ttl).Err()
}
