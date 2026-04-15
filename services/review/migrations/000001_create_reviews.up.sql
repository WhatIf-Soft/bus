CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE review_status AS ENUM ('published', 'pending_moderation', 'rejected', 'hidden');

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    operator_id UUID NOT NULL,
    booking_id UUID NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(160),
    body TEXT,
    status review_status NOT NULL DEFAULT 'published',
    operator_reply TEXT,
    operator_replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, booking_id)
);

CREATE INDEX idx_reviews_operator ON reviews (operator_id, status, created_at DESC);
CREATE INDEX idx_reviews_user ON reviews (user_id, created_at DESC);
