CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE booking_status AS ENUM (
    'pending_seat',
    'pending_payment',
    'confirmed',
    'cancelled',
    'expired',
    'failed',
    'refunded',
    'used',
    'disputed',
    'partially_cancelled',
    'partially_refunded'
);

CREATE TYPE passenger_category AS ENUM ('adult', 'child', 'senior', 'student');

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    trip_id UUID NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending_seat',
    total_price_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
    lock_expires_at TIMESTAMPTZ NOT NULL,
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE booking_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_number VARCHAR(8) NOT NULL,
    passenger_first_name VARCHAR(100) NOT NULL,
    passenger_last_name VARCHAR(100) NOT NULL,
    passenger_category passenger_category NOT NULL DEFAULT 'adult',
    price_cents INTEGER NOT NULL,
    UNIQUE (booking_id, seat_number)
);

CREATE INDEX idx_bookings_user ON bookings (user_id, status, created_at DESC);
CREATE INDEX idx_bookings_trip ON bookings (trip_id, status);
CREATE INDEX idx_bookings_lock_exp ON bookings (lock_expires_at) WHERE status = 'pending_seat' OR status = 'pending_payment';
CREATE INDEX idx_booking_seats_booking ON booking_seats (booking_id);
