package config

import (
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Booking  ServiceURL
	Search   ServiceURL
	JWT      JWTConfig
	Log      LogConfig
}

type ServerConfig struct {
	Host string
	Port int
}
type DatabaseConfig struct{ DSN string }
type ServiceURL struct{ URL string }
type JWTConfig struct{ Secret string }
type LogConfig struct{ Level string }

func Load() (*Config, error) {
	v := viper.New()
	v.SetConfigName("config")
	v.AddConfigPath(".")
	v.SetEnvPrefix("REVIEW_SERVICE")
	v.AutomaticEnv()

	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.port", 4008)
	v.SetDefault("database.dsn",
		"postgres://busexpress:busexpress_dev@localhost:5433/busexpress_reviews?sslmode=disable")
	v.SetDefault("booking.url", "http://localhost:4003")
	v.SetDefault("search.url", "http://localhost:4002")
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
