-- Test seed data — run this in the Supabase SQL editor after the migration.
-- Creates one operator and one event you can use to generate test tokens.

insert into operators (id, name, secret_key) values (
  '00000000-0000-0000-0000-000000000001',
  'Test Festival Co.',
  'test-secret-key-change-in-prod'
) on conflict (id) do nothing;

insert into events (id, name, slug, festival_name, operator_id, event_date) values (
  '00000000-0000-0000-0000-000000000002',
  'Main Stage Weekend',
  'main-stage-weekend',
  'Horizon Festival 2026',
  '00000000-0000-0000-0000-000000000001',
  '2026-08-15'
) on conflict (id) do nothing;
