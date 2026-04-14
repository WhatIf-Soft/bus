package logging

import (
	"context"
	"io"
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

type contextKey struct{}

// NewLogger creates a zerolog logger with JSON output, timestamp, and caller info.
func NewLogger(level string) zerolog.Logger {
	lvl := parseLevel(level)

	return zerolog.New(logWriter()).
		Level(lvl).
		With().
		Timestamp().
		Caller().
		Logger()
}

// FromContext extracts the logger from context, falling back to a default logger.
func FromContext(ctx context.Context) zerolog.Logger {
	if logger, ok := ctx.Value(contextKey{}).(zerolog.Logger); ok {
		return logger
	}
	return NewLogger("info")
}

// WithLogger stores a logger in the context.
func WithLogger(ctx context.Context, logger zerolog.Logger) context.Context {
	return context.WithValue(ctx, contextKey{}, logger)
}

func logWriter() io.Writer {
	zerolog.TimeFieldFormat = time.RFC3339Nano
	return os.Stdout
}

func parseLevel(level string) zerolog.Level {
	switch strings.ToLower(level) {
	case "debug":
		return zerolog.DebugLevel
	case "info":
		return zerolog.InfoLevel
	case "warn", "warning":
		return zerolog.WarnLevel
	case "error":
		return zerolog.ErrorLevel
	case "fatal":
		return zerolog.FatalLevel
	case "panic":
		return zerolog.PanicLevel
	case "trace":
		return zerolog.TraceLevel
	default:
		return zerolog.InfoLevel
	}
}
