CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- A user with role='operateur' may own one operator profile.
CREATE TABLE operator_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE bus_class AS ENUM ('standard', 'vip', 'sleeper');
CREATE TYPE bus_status AS ENUM ('active', 'maintenance', 'retired');

CREATE TABLE buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profiles(id) ON DELETE CASCADE,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    model VARCHAR(120) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 80),
    class bus_class NOT NULL DEFAULT 'standard',
    amenities JSONB NOT NULL DEFAULT '[]',
    status bus_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE driver_status AS ENUM ('active', 'on_leave', 'suspended', 'former');

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profiles(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(60) UNIQUE NOT NULL,
    phone VARCHAR(20),
    license_expires_at DATE NOT NULL,
    status driver_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configurable cancellation policy per operator (CLAUDE.md §7.2).
CREATE TABLE cancellation_policies (
    operator_id UUID PRIMARY KEY REFERENCES operator_profiles(id) ON DELETE CASCADE,
    refund_pct_24h INTEGER NOT NULL DEFAULT 100 CHECK (refund_pct_24h BETWEEN 0 AND 100),
    refund_pct_2_to_24h INTEGER NOT NULL DEFAULT 50 CHECK (refund_pct_2_to_24h BETWEEN 0 AND 100),
    refund_pct_under_2h INTEGER NOT NULL DEFAULT 0 CHECK (refund_pct_under_2h BETWEEN 0 AND 100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configurable baggage allowance per operator (CLAUDE.md §10).
CREATE TABLE baggage_policies (
    operator_id UUID PRIMARY KEY REFERENCES operator_profiles(id) ON DELETE CASCADE,
    free_kg INTEGER NOT NULL DEFAULT 20 CHECK (free_kg >= 0),
    extra_fee_per_kg_cents INTEGER NOT NULL DEFAULT 50000 CHECK (extra_fee_per_kg_cents >= 0),
    max_kg_per_passenger INTEGER NOT NULL DEFAULT 50 CHECK (max_kg_per_passenger > 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_buses_operator ON buses (operator_id, status);
CREATE INDEX idx_drivers_operator ON drivers (operator_id, status);
