package config

import (
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	Server ServerConfig
	SMTP   SMTPConfig
	Log    LogConfig
}

type ServerConfig struct {
	Host string
	Port int
}

type SMTPConfig struct {
	Addr string
	From string
}

type LogConfig struct {
	Level string
}

func Load() (*Config, error) {
	v := viper.New()
	v.SetConfigName("config")
	v.AddConfigPath(".")
	v.SetEnvPrefix("NOTIFICATION_SERVICE")
	v.AutomaticEnv()

	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.port", 4006)
	v.SetDefault("smtp.addr", "localhost:1025")
	v.SetDefault("smtp.from", "noreply@busexpress.dev")
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
