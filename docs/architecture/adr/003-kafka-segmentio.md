# ADR-003: Kafka Client — segmentio/kafka-go

## Status: Accepted

## Context

BusExpress uses Apache Kafka for asynchronous event processing across five core topics: booking-events, payment-events, notification-events, fraud-scoring, and ml-feedback. We needed a Go Kafka client library that is reliable, easy to build, and sufficient for our event volumes.

The two candidates evaluated were:

- **confluent-kafka-go**: Official Confluent client, wraps librdkafka (C library) via CGo.
- **segmentio/kafka-go**: Pure Go implementation with no CGo dependency.

## Decision

We chose **segmentio/kafka-go** as the Kafka client for all BusExpress microservices.

Key reasons:

- **Pure Go, no CGo**: confluent-kafka-go depends on librdkafka via CGo, which complicates Docker builds (requires C toolchain in build stage), breaks simple cross-compilation, and increases image size. segmentio/kafka-go is pure Go — `go build` just works.
- **Simpler Docker builds**: Multi-stage Docker builds stay lean. No need for gcc, musl-dev, or librdkafka-dev in the build stage.
- **Adequate for BusExpress volumes**: BusExpress is a marketplace serving West African bus operators. Expected event throughput is well within segmentio/kafka-go's capabilities (tens of thousands of messages/second). The ultra-high-throughput optimizations in librdkafka are unnecessary.
- **Clean API**: segmentio/kafka-go provides both a high-level `Reader`/`Writer` API and a low-level `Conn` API, covering both simple consumer/producer patterns and advanced use cases.

## Consequences

**Positive:**

- Docker images are smaller and faster to build.
- Cross-compilation to linux/arm64 works without additional toolchain setup.
- No C library version mismatches or CGo debugging.
- Simpler CI/CD pipeline with fewer build dependencies.

**Negative:**

- segmentio/kafka-go may lag behind librdkafka in supporting the newest Kafka protocol features.
- For extremely high throughput scenarios (millions of messages/second), librdkafka's C-level optimizations would be faster. This is not a concern at BusExpress's scale.
- Some advanced Kafka features (e.g., transactional producers) have more mature support in confluent-kafka-go.
