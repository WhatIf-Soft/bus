# ADR-006: gRPC Internal, REST External

## Status: Accepted

## Context

BusExpress is composed of 15+ microservices that communicate with each other and serve external clients (PWA, mobile apps, third-party API consumers). We needed a communication strategy that balances internal efficiency with external accessibility.

## Decision

We use a dual-protocol approach:

- **gRPC with Protocol Buffers** (managed via `buf`) for all internal service-to-service communication.
- **REST JSON over HTTP** (via chi router, ADR-001) for all client-facing APIs.

Key reasons:

- **gRPC internally**: Protocol Buffers provide type-safe, versioned contracts between services. The binary wire format is more efficient than JSON for high-frequency internal calls (e.g., booking-service calling payment-service). Code generation via `buf` produces Go client/server stubs, eliminating hand-written HTTP clients and reducing integration bugs.
- **REST externally**: REST with JSON is the universal standard for web and mobile clients. The PWA (Next.js), React Native mobile app, and future third-party API consumers all work with REST natively. No additional client library or protobuf compilation is required on the frontend.
- **buf for proto management**: buf provides linting, breaking change detection, and consistent code generation. Proto files live in `proto/` and are the source of truth for internal API contracts.

## Consequences

**Positive:**

- Internal service contracts are strongly typed and version-checked at build time.
- Breaking changes between services are detected by `buf breaking` before merge.
- External API consumers use standard HTTP tooling (curl, fetch, Postman) without protobuf knowledge.
- Binary protocol reduces internal network payload size and serialization cost.

**Negative:**

- Two protocol stacks to maintain (gRPC + REST), increasing the surface area of the API gateway.
- Developers must be proficient in both Protocol Buffers and REST API design.
- The API gateway must translate between gRPC (internal) and REST (external) for some operations, adding a translation layer.
- Proto file management and code generation add a build step that must be integrated into CI.
