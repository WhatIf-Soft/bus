CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'succeeded',
    'failed',
    'cancelled',
    'refunded'
);

CREATE TYPE payment_method AS ENUM (
    'card',
    'orange_money',
    'wave',
    'mtn_momo',
    'moov_money'
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
    method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    external_ref VARCHAR(120),
    failure_reason TEXT,
    msisdn VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_booking ON payments (booking_id);
CREATE INDEX idx_payments_user ON payments (user_id, status, created_at DESC);
CREATE INDEX idx_payments_status ON payments (status, created_at);
