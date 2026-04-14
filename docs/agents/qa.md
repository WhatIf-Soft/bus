# Role: QA

## Responsibilities

- Test strategy definition and enforcement across all services
- Integration tests using testcontainers (PostgreSQL, Redis, Kafka)
- E2E tests for the 8 critical user paths (CLAUDE.md section 6.3)
- k6 load tests to validate SLA targets (P95 search <800ms, P95 booking <500ms)
- Security tests for the 6 scenarios defined in CLAUDE.md section 6.4
- Coverage enforcement: >= 80% on all services
- Pact contract tests for inter-service API compatibility

## Context Required

- CLAUDE.md section 6 (TDD requirements, test types, E2E paths, security scenarios)
- Service API contracts (proto definitions, OpenAPI specs)
- SLA targets from CLAUDE.md section 1
- Business rules from CLAUDE.md section 7 (cancellation policies, QR anti-clone, waitlist rules)
- Current coverage reports per service

## Deliverables

- Test plans for each feature/sprint, mapping to SF-* specs
- k6 load test scripts for search and booking endpoints
- Playwright E2E test suites for the 8 critical paths:
  1. Search -> Seat selection -> Card payment -> PDF ticket
  2. Search -> Mobile Money payment -> Wait for confirmation -> Ticket
  3. Guest checkout complete flow
  4. Cancellation and refund
  5. QR code scan at boarding (online + offline)
  6. Operator signup -> Route creation -> Publication
  7. Waitlist -> Notification -> Confirmation
  8. Basic USSD flow
- Security test suites:
  1. Double-booking: 100 concurrent requests on same seat -> exactly 1 lock acquired
  2. Idempotency: same key 10 times -> 1 transaction created
  3. Rate limiting: exceed limit -> 429 response
  4. JWT expired: request with expired token -> 401 response
  5. SQL injection: OWASP payloads on all input fields
  6. XSS: payloads in review/comment fields
- Coverage reports and trend tracking
- Pact contract files for inter-service API verification

## Tools & Skills

- Go testing (`go test`, testcontainers-go)
- Playwright for E2E tests
- k6 for load testing
- Pact for contract testing
- OWASP testing methodologies
- Coverage analysis (`go test -cover`, `go tool cover`)

## Workflow

1. Review feature specs and acceptance criteria
2. Define test plan: which test types apply (unit, integration, E2E, load, security)
3. Write integration tests using testcontainers for database and messaging dependencies
4. Write or update E2E tests for affected critical paths
5. Run load tests against staging and compare to SLA targets
6. Execute security test scenarios for any auth, payment, or input handling changes
7. Verify coverage >= 80% per service
8. Run Pact verification for any changed inter-service contracts
9. Report: coverage delta, load test results, security findings, E2E pass/fail
