-- GPS position data is stored in InfluxDB for time-series efficiency.
-- This Postgres table tracks which trips have active GPS tracking enabled
-- and which driver/bus is assigned.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE tracking_status AS ENUM ('active', 'completed', 'disconnected');

CREATE TABLE trip_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID UNIQUE NOT NULL,
    bus_id UUID,
    driver_id UUID,
    status tracking_status NOT NULL DEFAULT 'active',
    last_lat DOUBLE PRECISION,
    last_lng DOUBLE PRECISION,
    last_speed_kmh DOUBLE PRECISION,
    last_updated_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tracking_trip ON trip_tracking (trip_id, status);
