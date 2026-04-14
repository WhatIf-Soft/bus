package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

// Config holds all configuration for the user service.
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	Kafka    KafkaConfig
	JWT      JWTConfig
	Log      LogConfig
}

// ServerConfig holds HTTP server settings.
type ServerConfig struct {
	Host string
	Port int
}

// DatabaseConfig holds PostgreSQL connection settings.
type DatabaseConfig struct {
	DSN string
}

// RedisConfig holds Redis connection settings.
type RedisConfig struct {
	Addrs []string
}

// KafkaConfig holds Kafka connection settings.
type KafkaConfig struct {
	Brokers []string
}

// JWTConfig holds JWT authentication settings.
type JWTConfig struct {
	Secret     string
	AccessTTL  time.Duration
	RefreshTTL time.Duration
}

// LogConfig holds logging settings.
type LogConfig struct {
	Level string
}

// Load reads configuration from file and environment variables.
// It searches for a file named "config" (config.yaml) in the current directory
// and binds environment variables with the prefix USER_SERVICE.
func Load() (*Config, error) {
	v := viper.New()

	v.SetConfigName("config")
	v.AddConfigPath(".")
	v.SetEnvPrefix("USER_SERVICE")
	v.AutomaticEnv()

	// Defaults
	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.port", 4001)
	v.SetDefault("database.dsn", "postgres://busexpress:busexpress@localhost:5432/busexpress_users?sslmode=disable")
	v.SetDefault("redis.addrs", []string{"localhost:6379"})
	v.SetDefault("kafka.brokers", []string{"localhost:9092"})
	v.SetDefault("jwt.secret", "change-me-in-production")
	v.SetDefault("jwt.accessttl", 15*time.Minute)
	v.SetDefault("jwt.refreshttl", 30*24*time.Hour)
	v.SetDefault("log.level", "info")

	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
		// Config file not found is acceptable; we rely on defaults and env vars.
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return &cfg, nil
}
