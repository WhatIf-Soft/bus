package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

// Config holds all configuration for the booking service.
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	Kafka    KafkaConfig
	Search   SearchConfig
	Waitlist WaitlistConfig
	JWT      JWTConfig
	Lock     LockConfig
	Log      LogConfig
}

type KafkaConfig struct {
	Brokers []string
}

type ServerConfig struct {
	Host string
	Port int
}

type DatabaseConfig struct {
	DSN string
}

type RedisConfig struct {
	Addrs []string
}

type SearchConfig struct {
	URL string
}

type WaitlistConfig struct {
	URL string
}

type JWTConfig struct {
	Secret string
}

type LockConfig struct {
	TTL time.Duration
}

type LogConfig struct {
	Level string
}

// Load reads configuration from file and environment variables.
func Load() (*Config, error) {
	v := viper.New()
	v.SetConfigName("config")
	v.AddConfigPath(".")
	v.SetEnvPrefix("BOOKING_SERVICE")
	v.AutomaticEnv()

	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.port", 4003)
	v.SetDefault("database.dsn",
		"postgres://busexpress:busexpress_dev@localhost:5433/busexpress_bookings?sslmode=disable")
	v.SetDefault("redis.addrs", []string{"localhost:6379", "localhost:6380", "localhost:6381"})
	v.SetDefault("kafka.brokers", []string{})
	v.SetDefault("search.url", "http://localhost:4002")
	v.SetDefault("waitlist.url", "http://localhost:4009")
	v.SetDefault("jwt.secret", "dev-secret-change-me")
	v.SetDefault("lock.ttl", 10*time.Minute)
	v.SetDefault("log.level", "info")

	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("read config: %w", err)
		}
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("unmarshal config: %w", err)
	}
	return &cfg, nil
}
