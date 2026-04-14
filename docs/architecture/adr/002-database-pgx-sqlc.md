# ADR-002: Database Driver and Query Layer — pgx + sqlc

## Status: Accepted

## Context

BusExpress relies heavily on PostgreSQL for its core data model (21 entities), PostGIS for geospatial queries (stop locations, route geometry), and JSONB for flexible schema fields (seat layouts, amenities). We needed a database access strategy that maximizes performance, type safety, and security.

The primary alternatives considered were:

- **GORM**: Full ORM with struct tags, auto-migration, and reflection-based query building.
- **pgx + sqlc**: Low-level driver (pgx) paired with a SQL-first code generator (sqlc).

## Decision

We chose **pgx v5** as the PostgreSQL driver and **sqlc** as the query layer.

Key reasons:

- **pgx v5 performance**: pgx is the highest-performance pure-Go PostgreSQL driver. It supports native protocol features (binary encoding, prepared statements, connection pooling via pgxpool) that outperform database/sql-based drivers.
- **Native type support**: pgx natively handles UUID, JSONB, PostGIS geography types, PostgreSQL enums, and arrays without custom serialization or third-party plugins.
- **sqlc type safety**: sqlc generates Go structs and query functions directly from SQL files. The generated code is fully typed — column names, nullable fields, and enum values are all reflected in the Go types at compile time.
- **Parameterized queries enforced**: sqlc only accepts parameterized SQL (`$1`, `$2`). It is structurally impossible to produce a SQL injection vulnerability through sqlc-generated code, satisfying the project's security requirements (OWASP Top 10, Section 3.5).
- **Zero runtime reflection**: Unlike GORM, neither pgx nor sqlc uses reflection at runtime. This eliminates an entire class of subtle bugs and improves performance under load.

## Consequences

**Positive:**

- Query performance is predictable and close to raw SQL execution.
- Type mismatches between Go code and the database schema are caught at build time (via `sqlc generate`).
- SQL injection is structurally prevented by the toolchain.
- Full access to PostgreSQL-specific features (CTEs, window functions, PostGIS, advisory locks) without ORM workarounds.

**Negative:**

- Developers must write raw SQL. This requires PostgreSQL fluency across the team.
- Schema changes require regenerating sqlc output and updating migration files manually.
- No auto-migration — migrations are managed explicitly (see DBA workflow).
- More boilerplate for simple CRUD compared to an ORM, partially mitigated by sqlc's code generation.
