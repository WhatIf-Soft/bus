CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE api_key_tier AS ENUM ('free', 'certified');

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_hash VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    tier api_key_tier NOT NULL DEFAULT 'free',
    rate_limit_rpm INTEGER NOT NULL DEFAULT 100,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_hash ON api_keys (key_hash) WHERE active = TRUE;
