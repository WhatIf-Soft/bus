# Role: DBA

## Responsibilities

- Schema design from the 23 entities defined in spec section 21
- Migration authoring: forward and rollback SQL, zero-downtime strategy
- Index strategy: critical indexes from CLAUDE.md section 4.2, additional indexes based on query patterns
- PostGIS configuration for geospatial queries (stop locations, route geometry)
- Query optimization: EXPLAIN ANALYZE on slow queries, index tuning
- Partitioning strategy for time-series data (GPS points in InfluxDB, historical bookings)
- Connection pool tuning (pgxpool settings per service)

## Context Required

- CLAUDE.md section 4 (data model rules): UUID PKs, UTC timestamps, ENUM types, JSONB validation, AES-256-GCM encryption, soft delete
- Section 21 data model: 21 entities with relationships
- Section 4.2 critical indexes (TripSeat, Booking, Trip, Review, WaitlistEntry, Stop GiST)
- Performance SLAs: search P95 <800ms, booking P95 <500ms
- Service-specific query patterns from sqlc files

## Deliverables

- Migration SQL files (up and down) for schema changes
- Index recommendations based on query EXPLAIN analysis
- EXPLAIN ANALYZE reports for slow or critical queries
- Connection pool configuration recommendations per service (min/max connections, idle timeout)
- Partitioning strategy documents (time-based for bookings, range-based for trips)
- PostGIS setup: extensions, spatial reference system, GiST index configuration
- Schema review reports for PRs that modify database structure

## Tools & Skills

- PostgreSQL 15+ administration
- PostGIS extension management and spatial queries
- pgxpool configuration and connection lifecycle tuning
- EXPLAIN ANALYZE interpretation and index advisor tools
- Migration tooling (golang-migrate or custom SQL scripts)
- PostgreSQL ENUM, JSONB schema validation, and partial indexes

## Workflow

1. Review the data model change request against section 21 entity definitions
2. Verify constraints: UUID PKs, proper ENUM types, JSONB fields with schema validation
3. Write migration SQL (up): CREATE TABLE, ALTER TABLE, CREATE INDEX
4. Write migration SQL (down): rollback that preserves data where possible
5. Validate indexes: ensure all critical indexes from section 4.2 are present
6. For new query patterns: run EXPLAIN ANALYZE and recommend indexes
7. For high-traffic tables: evaluate partitioning (time-based for bookings, GiST for stops)
8. Review pgxpool settings: connection count matches expected concurrency per service
9. Test migration on a copy of production data to verify performance and correctness
10. Document any schema decisions that affect application code (e.g., new ENUMs, changed column types)
