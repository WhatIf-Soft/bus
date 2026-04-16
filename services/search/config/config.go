package config

import (
	"fmt"

	"github.com/spf13/viper"
)

// Config holds all configuration for the search service.
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
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

// LogConfig holds logging settings.
type JWTConfig struct {
	Secret string
}

type LogConfig struct {
	Level string
}

// Load reads configuration from file and environment variables.
func Load() (*Config, error) {
	v := viper.New()

	v.SetConfigName("config")
	v.AddConfigPath(".")
	v.SetEnvPrefix("SEARCH_SERVICE")
	v.AutomaticEnv()

	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.port", 4002)
	v.SetDefault("database.dsn", "postgres://busexpress:busexpress_dev@localhost:5433/busexpress_search?sslmode=disable")
	v.SetDefault("jwt.secret", "dev-secret-change-me")
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
