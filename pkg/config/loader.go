package config

import (
	"strings"

	"github.com/spf13/viper"
)

// Load reads a YAML configuration file and unmarshals it into target.
// Environment variables with the BUSEXPRESS_ prefix override file values.
func Load(configName string, configPath string, target interface{}) error {
	v := viper.New()

	v.SetConfigName(configName)
	v.AddConfigPath(configPath)
	v.SetConfigType("yaml")

	v.SetEnvPrefix("BUSEXPRESS")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_", "-", "_"))
	v.AutomaticEnv()

	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return err
		}
	}

	return v.Unmarshal(target)
}
