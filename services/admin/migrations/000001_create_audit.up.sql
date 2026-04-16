CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Append-only audit trail per CLAUDE.md §3.7.
-- Rows are never updated or deleted. HMAC chain links each row to the previous.
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seq BIGSERIAL UNIQUE NOT NULL,
    kind VARCHAR(60) NOT NULL,
    actor_id UUID NOT NULL,
    actor_role VARCHAR(30) NOT NULL DEFAULT 'system',
    subject_type VARCHAR(30) NOT NULL,
    subject_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}',
    prev_hmac VARCHAR(64) NOT NULL DEFAULT '',
    hmac VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_kind ON audit_events (kind, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_events (actor_id, created_at DESC);
CREATE INDEX idx_audit_subject ON audit_events (subject_type, subject_id, created_at DESC);
