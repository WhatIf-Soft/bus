-- Backfill operator_profiles with the same UUIDs used in search-service seeds.
-- This unifies operator ids across search, booking, review, and reconciliation.
-- Each profile is owned by a synthetic operator user created below.

-- Create owner users in the users DB first (run in busexpress_users).
-- This migration only creates the operator_profiles rows (run in busexpress_operator).

INSERT INTO operator_profiles (id, user_id, name, contact_email, created_at, updated_at)
VALUES
    ('11111111-1111-1111-1111-111111111111',
     '00000001-0000-0000-0000-000000000001',
     'STC Ghana', 'contact@stc-ghana.dev', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222',
     '00000002-0000-0000-0000-000000000002',
     'Africa Trans', 'contact@africa-trans.dev', NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333',
     '00000003-0000-0000-0000-000000000003',
     'Sahel Express', 'contact@sahel-express.dev', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
