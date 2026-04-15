CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE waitlist_status AS ENUM (
    'queued',
    'notified',
    'expired',
    'cancelled',
    'fulfilled'
);

CREATE TABLE waitlist_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    trip_id UUID NOT NULL,
    seats_requested INTEGER NOT NULL CHECK (seats_requested BETWEEN 1 AND 9),
    status waitlist_status NOT NULL DEFAULT 'queued',
    notified_at TIMESTAMPTZ,
    confirm_deadline TIMESTAMPTZ,
    fulfilled_booking_id UUID,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, trip_id)
);

-- FIFO scan per trip prefers status='queued' ordered by created_at.
CREATE INDEX idx_waitlist_trip_queue ON waitlist_entries (trip_id, status, created_at);
CREATE INDEX idx_waitlist_user ON waitlist_entries (user_id, status, created_at DESC);
CREATE INDEX idx_waitlist_deadline ON waitlist_entries (confirm_deadline) WHERE status = 'notified';
