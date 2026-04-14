package kafka

import (
	"context"

	kafkago "github.com/segmentio/kafka-go"
)

// Producer wraps a kafka.Writer for publishing messages.
type Producer struct {
	writer *kafkago.Writer
}

// NewProducer creates a new Kafka producer for the given broker addresses.
func NewProducer(brokers []string) *Producer {
	writer := &kafkago.Writer{
		Addr:     kafkago.TCP(brokers...),
		Balancer: &kafkago.LeastBytes{},
	}
	return &Producer{writer: writer}
}

// Publish sends a message to the specified Kafka topic.
func (p *Producer) Publish(ctx context.Context, topic string, key string, value []byte) error {
	return p.writer.WriteMessages(ctx, kafkago.Message{
		Topic: topic,
		Key:   []byte(key),
		Value: value,
	})
}

// Close shuts down the producer and flushes pending writes.
func (p *Producer) Close() error {
	return p.writer.Close()
}
