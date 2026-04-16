CREATE TYPE agency_role AS ENUM ('admin_operateur', 'manager_agence', 'agent_guichet');

CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operator_profiles(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    city VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agency_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role agency_role NOT NULL DEFAULT 'agent_guichet',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (agency_id, user_id)
);

CREATE INDEX idx_agencies_operator ON agencies (operator_id);
CREATE INDEX idx_agency_members_user ON agency_members (user_id);
