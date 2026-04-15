package config

import (
	"fmt"

	"github.com/spf13/viper"
)

// Config holds payment-service configuration.
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	Booking  BookingConfig
	JWT      JWTConfig
	Log      LogConfig
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

type BookingConfig struct {
	URL string
}

type JWTConfig struct {
	Secret string
}

type LogConfig struct {
	Level string
}

// Load reads config from file + env.
func Load() (*Config, error) {
	v := viper.New()
	v.SetConfigName("config")
	v.AddConfigPath(".")
	v.SetEnvPrefix("PAYMENT_SERVICE")
	v.AutomaticEnv()

	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.port", 4004)
	v.SetDefault("database.dsn",
		"postgres://busexpress:busexpress_dev@localhost:5433/busexpress_payments?sslmode=disable")
	v.SetDefault("redis.addrs", []string{"localhost:6379"})
	v.SetDefault("booking.url", "http://localhost:4003")
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
