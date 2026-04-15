-- Seed operators
INSERT INTO operators (id, name, rating, on_time_rate) VALUES
  ('11111111-1111-1111-1111-111111111111', 'STC Ghana', 4.5, 0.92),
  ('22222222-2222-2222-2222-222222222222', 'Africa Trans', 4.2, 0.88),
  ('33333333-3333-3333-3333-333333333333', 'Sahel Express', 3.9, 0.85);

-- Seed stops (West African hubs)
INSERT INTO stops (id, name, city, country, latitude, longitude) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Gare d''Abidjan', 'Abidjan', 'CI', 5.3600, -4.0083),
  ('a0000000-0000-0000-0000-000000000002', 'Gare de Yamoussoukro', 'Yamoussoukro', 'CI', 6.8276, -5.2893),
  ('a0000000-0000-0000-0000-000000000003', 'Gare de Bouake', 'Bouake', 'CI', 7.6890, -5.0300),
  ('a0000000-0000-0000-0000-000000000004', 'Gare de Lome', 'Lome', 'TG', 6.1725, 1.2314),
  ('a0000000-0000-0000-0000-000000000005', 'Gare d''Accra', 'Accra', 'GH', 5.6037, -0.1870),
  ('a0000000-0000-0000-0000-000000000006', 'Gare de Cotonou', 'Cotonou', 'BJ', 6.3703, 2.3912),
  ('a0000000-0000-0000-0000-000000000007', 'Gare de Ouagadougou', 'Ouagadougou', 'BF', 12.3714, -1.5197),
  ('a0000000-0000-0000-0000-000000000008', 'Gare de Bamako', 'Bamako', 'ML', 12.6392, -8.0029);

-- Seed routes
INSERT INTO routes (id, operator_id, origin_stop_id, destination_stop_id, distance_km, duration_minutes) VALUES
  ('b0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 240, 300),
  ('b0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 360, 420),
  ('b0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
   'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 450, 600),
  ('b0000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222',
   'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004', 180, 240),
  ('b0000000-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333',
   'a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000006', 150, 180),
  ('b0000000-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333',
   'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000007', 900, 840),
  ('b0000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111',
   'a0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000008', 800, 720);

-- Seed trips (next 14 days, multiple per route per day)
INSERT INTO trips (route_id, operator_id, departure_time, arrival_time, price_cents, currency, total_seats, available_seats, bus_class, amenities)
SELECT
    r.id,
    r.operator_id,
    (CURRENT_DATE + (d || ' days')::interval + (h || ' hours')::interval)::timestamptz,
    (CURRENT_DATE + (d || ' days')::interval + (h || ' hours')::interval + (r.duration_minutes || ' minutes')::interval)::timestamptz,
    CASE
        WHEN r.distance_km < 300 THEN 500000 + (r.distance_km * 500)
        WHEN r.distance_km < 600 THEN 1200000 + (r.distance_km * 400)
        ELSE 2500000 + (r.distance_km * 350)
    END,
    'XOF',
    50,
    50 - (random() * 20)::int,
    CASE WHEN r.distance_km > 500 THEN 'vip' ELSE 'standard' END,
    CASE
        WHEN r.distance_km > 500 THEN '["wifi","ac","usb","toilet"]'::jsonb
        ELSE '["ac"]'::jsonb
    END
FROM routes r
CROSS JOIN generate_series(0, 13) d
CROSS JOIN (VALUES (6), (10), (14), (18), (22)) h(h);
