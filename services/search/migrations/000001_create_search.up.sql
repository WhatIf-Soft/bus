CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    logo_url VARCHAR(500),
    rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
    on_time_rate NUMERIC(4, 3) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    city VARCHAR(200) NOT NULL,
    country VARCHAR(2) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    origin_stop_id UUID NOT NULL REFERENCES stops(id),
    destination_stop_id UUID NOT NULL REFERENCES stops(id),
    distance_km INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE trip_status AS ENUM ('scheduled', 'boarding', 'departed', 'arrived', 'cancelled');

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    price_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    bus_class VARCHAR(50) NOT NULL DEFAULT 'standard',
    amenities JSONB NOT NULL DEFAULT '[]',
    status trip_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stops_city_trgm ON stops USING GIN (city gin_trgm_ops);
CREATE INDEX idx_stops_name_trgm ON stops USING GIN (name gin_trgm_ops);
CREATE INDEX idx_trips_search ON trips (departure_time, status, route_id);
CREATE INDEX idx_routes_origin_dest ON routes (origin_stop_id, destination_stop_id);
