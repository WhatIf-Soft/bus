ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0;

CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason VARCHAR(60) NOT NULL,
    booking_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loyalty_tx_user ON loyalty_transactions (user_id, created_at DESC);
