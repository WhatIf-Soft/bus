# ADR-001: Go HTTP Framework — Chi

## Status: Accepted

## Context

BusExpress backend is built as Go microservices. We needed an HTTP router/framework that balances productivity with long-term maintainability. The three candidates evaluated were Gin, Echo, and Chi (go-chi/chi/v5).

Gin and Echo are full frameworks with their own context types, requiring handlers to conform to vendor-specific signatures. This creates vendor lock-in and makes it harder to reuse standard library middleware or share handler code across projects.

## Decision

We chose **go-chi/chi/v5** as the HTTP router for all BusExpress microservices.

Key reasons:

- **stdlib net/http compatible**: Handlers are standard `http.HandlerFunc`. No proprietary context wrapper. Any `net/http` middleware works without adaptation.
- **No vendor lock-in**: Chi is a thin routing layer on top of the standard library. Migrating away requires minimal effort since all handler signatures are already `http.HandlerFunc`.
- **Excellent middleware composition**: Chi's middleware stack supports inline grouping, sub-routers, and per-route middleware chains. This maps naturally to BusExpress's need for different auth/rate-limiting policies per route group (public vs authenticated vs admin).
- **Lightweight**: No unnecessary abstractions, reflection, or code generation at runtime.

## Consequences

**Positive:**

- Handlers are portable and testable with `net/http/httptest` without any framework-specific setup.
- The full ecosystem of `net/http`-compatible middleware (CORS, logging, tracing) works out of the box.
- New team members familiar with Go's standard library are immediately productive.

**Negative:**

- Chi does not include built-in request binding, validation, or response serialization. These must be handled explicitly or via shared utility packages (e.g., `pkg/httputil`).
- Less "batteries included" than Gin or Echo — developers must be disciplined about consistent patterns across services.
