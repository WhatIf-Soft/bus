CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE ticket_status AS ENUM ('issued', 'used', 'cancelled', 'expired');

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL,
    user_id UUID NOT NULL,
    seat_number VARCHAR(8) NOT NULL,
    passenger_name VARCHAR(200) NOT NULL,
    trip_id UUID NOT NULL,
    status ticket_status NOT NULL DEFAULT 'issued',
    qr_signature VARCHAR(200) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE (booking_id, seat_number)
);

CREATE INDEX idx_tickets_booking ON tickets (booking_id);
CREATE INDEX idx_tickets_user ON tickets (user_id, status);
