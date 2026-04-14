package kafka

// KafkaConfig holds the configuration for Kafka consumers and producers.
type KafkaConfig struct {
	Brokers []string
	GroupID string
}
