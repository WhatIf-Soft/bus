CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE ticket_status AS ENUM (
    'open',
    'in_progress',
    'awaiting_customer',
    'resolved',
    'closed'
);

CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TYPE ticket_category AS ENUM (
    'booking',
    'payment',
    'refund',
    'account',
    'baggage',
    'incident',
    'other'
);

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    subject VARCHAR(200) NOT NULL,
    category ticket_category NOT NULL DEFAULT 'other',
    priority ticket_priority NOT NULL DEFAULT 'normal',
    status ticket_status NOT NULL DEFAULT 'open',
    booking_id UUID,
    assigned_agent_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

CREATE TYPE message_author AS ENUM ('user', 'agent', 'system');

CREATE TABLE support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    author_role message_author NOT NULL,
    author_id UUID NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON support_tickets (user_id, status, created_at DESC);
CREATE INDEX idx_tickets_status ON support_tickets (status, priority, created_at);
CREATE INDEX idx_tickets_agent ON support_tickets (assigned_agent_id, status);
CREATE INDEX idx_messages_ticket ON support_messages (ticket_id, created_at);
