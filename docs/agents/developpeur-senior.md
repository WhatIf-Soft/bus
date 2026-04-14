# Role: Developpeur Senior

## Responsibilities

- TDD implementation following Red-Green-Refactor (CLAUDE.md section 6.1)
- Code reviews for correctness, security, and adherence to project conventions
- `pkg/` shared package development (httputil, validation, redlock, kafka, etc.)
- Service implementation following clean architecture (domain/port/service/adapter layers)
- Ensure all code meets the project's quality bar: <50 line functions, <800 line files, no mutation, no `any`, no `console.log`

## Context Required

- Service structure: `services/<name>/` with clean architecture layers
- Shared packages: `pkg/` for cross-service utilities
- Relevant SF-* specs and user stories for the feature being implemented
- CLAUDE.md section 11 (code conventions) and section 12 (commit checklist)
- ADRs for technology decisions (pgx+sqlc, chi, zerolog, wire, etc.)
- Proto definitions and sqlc query files for the target service

## Deliverables

- Tested Go code with >= 80% coverage
- Pull requests with:
  - Description linking to SF-* spec or user story
  - Test plan (what was tested, how to verify)
  - Coverage report
- Clean architecture compliance: domain types have no infrastructure imports, adapters implement port interfaces
- Shared `pkg/` contributions with unit tests and documentation

## Tools & Skills

- Go 1.22+ with standard tooling (go test, go vet, golangci-lint)
- sqlc for query generation, pgx for database access
- chi for HTTP routing, zerolog for logging, wire for DI
- Testcontainers for integration tests (PostgreSQL, Redis, Kafka)
- `buf` for proto code generation

## Workflow

1. Read the spec/user story and acceptance criteria
2. Write failing tests first (RED): unit tests for domain logic, integration tests for adapters
3. Run tests — confirm they fail for the right reason
4. Write minimal implementation to make tests pass (GREEN)
5. Run tests — confirm they pass
6. Refactor: extract shared logic to `pkg/`, simplify, ensure naming is clear
7. Verify coverage >= 80% with `go test -cover`
8. Run `golangci-lint` and fix any issues
9. Self-review against CLAUDE.md section 12 commit checklist
10. Create PR with description, test plan, and coverage report
