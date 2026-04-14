# ADR-004: Structured Logging — zerolog

## Status: Accepted

## Context

BusExpress requires structured, machine-parseable logging across all microservices. Logs feed into Prometheus/Grafana for monitoring, alerting, and debugging. The project mandates no `console.log`-style unstructured output in production (CLAUDE.md section 11.2).

The two candidates evaluated were:

- **zap** (uber-go/zap): High-performance structured logger with a typed field API.
- **zerolog** (rs/zerolog): Zero-allocation JSON structured logger.

## Decision

We chose **zerolog** as the structured logging library for all BusExpress microservices.

Key reasons:

- **Zero-allocation design**: zerolog achieves zero allocations in most logging paths by writing directly to an `io.Writer` without intermediate object creation. This gives it the fastest benchmarks among Go structured loggers.
- **Native JSON output**: Every log entry is a valid JSON object by default, making it immediately parseable by log aggregation tools (Prometheus, Grafana Loki, ELK) without format conversion.
- **Chain-style API**: The fluent builder pattern (`log.Info().Str("key", "val").Msg("done")`) is ergonomic and produces consistent structured output across the team.
- **chi middleware compatibility**: zerolog provides an `hlog` package with `net/http`-compatible middleware for request logging, which integrates naturally with our chi router (ADR-001).

## Consequences

**Positive:**

- Minimal performance overhead from logging, even under high request volumes.
- Logs are immediately queryable in Grafana without parsing pipelines.
- Consistent JSON format across all services simplifies cross-service trace correlation.
- Zero-allocation design reduces GC pressure in latency-sensitive paths (search, booking).

**Negative:**

- zerolog's chain-style API can produce less readable code for complex log entries with many fields.
- Unlike zap, zerolog does not support `WithLazy` fields or deferred evaluation natively (though this is rarely needed).
- Team members accustomed to printf-style logging need to adapt to the structured builder pattern.
