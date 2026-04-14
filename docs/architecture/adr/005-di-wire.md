# ADR-005: Dependency Injection — google/wire

## Status: Accepted

## Context

Each BusExpress microservice has a dependency graph of repositories, services, handlers, middleware, and infrastructure clients (pgxpool, Redis, Kafka). We needed a dependency injection approach that catches wiring errors early and avoids runtime surprises.

The two candidates evaluated were:

- **uber/fx**: Runtime DI container using reflection. Dependencies are resolved at application startup.
- **google/wire**: Compile-time DI via code generation. Dependencies are resolved by generating Go code.

## Decision

We chose **google/wire** for dependency injection across all BusExpress microservices.

Key reasons:

- **Compile-time code generation**: wire generates plain Go functions that construct the dependency graph. If a dependency is missing or has a type mismatch, the code fails to compile. Wiring errors are caught at build time, not at application startup.
- **No runtime reflection**: Unlike fx, wire does not use `reflect` at runtime. The generated code is straightforward function calls, making it easy to read, debug, and profile.
- **Explicit and auditable**: The generated `wire_gen.go` files are committed to the repository and can be reviewed in PRs. There is no hidden container behavior.
- **Lightweight**: wire is a code generator, not a framework. It adds no runtime dependency to the binary.

## Consequences

**Positive:**

- Wiring bugs are impossible at runtime — if it compiles, the dependency graph is valid.
- Generated code is human-readable and debuggable with standard Go tools.
- No runtime overhead from reflection-based container resolution.
- New services follow a consistent pattern: define providers, run `wire`, commit the generated code.

**Negative:**

- Adding a new dependency requires re-running `wire` and committing the regenerated file.
- wire does not support runtime-conditional wiring (e.g., feature flags that swap implementations). This must be handled at the provider level.
- wire's `ProviderSet` grouping can become verbose in services with many dependencies, though this is mitigated by organizing providers by domain layer.
