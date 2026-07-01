-- Dev seed data for local testing
-- Run this in the Supabase SQL editor AFTER running 001_initial_schema.sql

-- Insert a test operator
insert into operators (id, name, secret_key) values (
  '00000000-0000-0000-0000-000000000001',
  'Test Festival Co.',
  'dev-secret-key-change-in-prod'
) on conflict (id) do nothing;

-- Insert a test event
insert into events (id, name, slug, festival_name, operator_id, event_date) values (
  '00000000-0000-0000-0000-000000000002',
  'Main Stage Weekend',
  'test-fest-2025',
  'TestFest 2025',
  '00000000-0000-0000-0000-000000000001',
  '2025-08-15'
) on conflict (id) do nothing;
