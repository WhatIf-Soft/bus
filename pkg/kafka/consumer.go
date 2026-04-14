package kafka

import (
	"context"

	kafkago "github.com/segmentio/kafka-go"
)

// Consumer wraps a kafka.Reader for consuming messages from a topic.
type Consumer struct {
	reader *kafkago.Reader
}

// NewConsumer creates a new Kafka consumer for the given topic and config.
func NewConsumer(cfg KafkaConfig, topic string) *Consumer {
	reader := kafkago.NewReader(kafkago.ReaderConfig{
		Brokers: cfg.Brokers,
		GroupID: cfg.GroupID,
		Topic:   topic,
	})
	return &Consumer{reader: reader}
}

// Read fetches the next message from the Kafka topic.
// It blocks until a message is available or the context is cancelled.
func (c *Consumer) Read(ctx context.Context) (kafkago.Message, error) {
	return c.reader.ReadMessage(ctx)
}

// Close shuts down the consumer.
func (c *Consumer) Close() error {
	return c.reader.Close()
}
