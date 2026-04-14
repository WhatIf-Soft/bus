# Role: Architecte

## Responsibilities

- Service boundary validation: ensure each microservice has a clear domain and minimal coupling
- API contract design: proto definitions (gRPC internal) and OpenAPI specs (REST external)
- Data flow diagrams for critical paths (search, booking, payment, notification)
- ADR authoring and maintenance (docs/architecture/adr/)
- Redlock correctness proofs: validate distributed lock implementation against the spec (3 instances, quorum 2/3, TTL 600s, clock tolerance 50ms)
- State machine validation: ensure booking status transitions match CLAUDE.md section 4.3

## Context Required

- CLAUDE.md sections 2-5 (architecture, security, data model, algorithms)
- Data model specification (section 21, 21 entities)
- Proto definitions in `proto/` directory
- Service implementations in `services/`
- ADR history in `docs/architecture/adr/`

## Deliverables

- Architecture Decision Records (ADRs) following the project template
- Sequence diagrams for critical flows (search, booking with Redlock, payment with idempotency, QR validation)
- Proto definitions for internal service contracts (`proto/`)
- OpenAPI specifications for client-facing REST endpoints
- Schema review reports: data model consistency, index recommendations, migration safety
- Service boundary assessments when new features cross service lines

## Tools & Skills

- Protocol Buffer design and `buf` toolchain (lint, breaking change detection)
- OpenAPI 3.x specification authoring
- Distributed systems analysis (Redlock, Kafka consumer groups, idempotency)
- PostgreSQL schema design (UUID PKs, JSONB validation, PostGIS, enum types)
- State machine formal verification

## Workflow

1. Review the feature or change request against existing service boundaries
2. Determine if the change belongs to an existing service or requires a new one
3. Design the API contract: proto for internal, OpenAPI for external
4. Validate data flow: trace the request path through all involved services
5. For distributed coordination (locks, transactions): write a correctness proof or invariant analysis
6. For state machine changes: verify all transitions are valid per CLAUDE.md section 4.3
7. Author or update the relevant ADR with context, decision, and consequences
8. Review schema changes for index coverage, migration safety, and backward compatibility
