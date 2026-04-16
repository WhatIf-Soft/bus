CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    origin_city VARCHAR(200) NOT NULL,
    destination_city VARCHAR(200) NOT NULL,
    max_price_cents INTEGER NOT NULL CHECK (max_price_cents > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, origin_city, destination_city)
);

CREATE INDEX idx_price_alerts_active ON price_alerts (active, origin_city, destination_city);
CREATE INDEX idx_price_alerts_user ON price_alerts (user_id, active);
