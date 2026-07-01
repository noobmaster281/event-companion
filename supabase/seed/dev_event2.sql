-- ============================================================
-- Dev seed: second event (Neon Bloom 2026) + attendees
-- Run AFTER dev_seed.sql and dev_users.sql
-- Some attendees overlap with TestFest 2025 (event 002)
-- ============================================================

-- ============================================================
-- EVENT
-- ============================================================
insert into events (id, name, slug, festival_name, operator_id, event_date, photo_url, ticket_url) values (
  '00000000-0000-0000-0000-000000000003',
  'Desert Stage Weekend',
  'neon-bloom-desert-2026',
  'Neon Bloom 2026',
  '00000000-0000-0000-0000-000000000001',
  '2026-09-20',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80',
  'https://example.com/tickets/neon-bloom-2026'
) on conflict (id) do nothing;

-- ============================================================
-- NEW AUTH USERS (unique to Neon Bloom or cross-event)
-- ============================================================
insert into auth.users (
  id, email, email_confirmed_at, created_at, updated_at, aud, role,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) values
  ('a0000000-0000-0000-0000-000000000013', 'river@example.com',   now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000014', 'jade@example.com',    now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000015', 'theo@example.com',    now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000016', 'sienna@example.com',  now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000017', 'kai@example.com',     now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000018', 'remi@example.com',    now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false)
on conflict (id) do nothing;

-- ============================================================
-- PUBLIC USER PROFILES (new users only — existing ones already exist)
-- ============================================================
insert into users (id, email, name, vibe_tags, group_size_preference, instagram_handle, tiktok_handle, snapchat_handle, profile_complete) values
  ('a0000000-0000-0000-0000-000000000013', 'river@example.com',  'River',  '{dance-all-night,discover-new-artists}',          4, 'river.waves',    null,            null,         true),
  ('a0000000-0000-0000-0000-000000000014', 'jade@example.com',   'Jade',   '{chill-vibes,photographer}',                      3, null,             'jadevisuals',   null,         true),
  ('a0000000-0000-0000-0000-000000000015', 'theo@example.com',   'Theo',   '{here-for-headliners,front-row-energy}',           5, 'theogoeshard',   null,            null,         true),
  ('a0000000-0000-0000-0000-000000000016', 'sienna@example.com', 'Sienna', '{festival-foodie,chill-vibes,first-timer}',        3, null,             null,            'sienna.snap', true),
  ('a0000000-0000-0000-0000-000000000017', 'kai@example.com',    'Kai',    '{dance-all-night,front-row-energy}',               6, 'kai_sets',       null,            null,         true),
  ('a0000000-0000-0000-0000-000000000018', 'remi@example.com',   'Remi',   '{discover-new-artists,photographer,chill-vibes}',  2, null,             'remi.lens',     null,         true)
on conflict (id) do nothing;

-- ============================================================
-- VERIFIED BADGES FOR NEON BLOOM 2026
-- Overlapping attendees: Maya (001), Leo (002), Priya (003), Felix (008)
-- New attendees: River (013) through Remi (018)
-- ============================================================
insert into verified_badges (user_id, event_id) values
  -- cross-event attendees (also go to TestFest)
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'), -- Maya
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'), -- Leo
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003'), -- Priya
  ('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003'), -- Felix
  -- new attendees
  ('a0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000003'), -- River
  ('a0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000003'), -- Jade
  ('a0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000003'), -- Theo
  ('a0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000003'), -- Sienna
  ('a0000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000003'), -- Kai
  ('a0000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000003')  -- Remi
on conflict (user_id, event_id) do nothing;

-- ============================================================
-- GROUPS FOR NEON BLOOM 2026
-- ============================================================

-- Group 4: confirmed (3 members) — Kai's crew
insert into groups (id, event_id, name, status, created_by) values
  ('b0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'Desert front row', 'confirmed', 'a0000000-0000-0000-0000-000000000017')
on conflict (id) do nothing;

insert into group_members (group_id, user_id, status) values
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000017', 'confirmed'), -- Kai (creator)
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000015', 'confirmed'), -- Theo
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'confirmed'), -- Maya (cross-event)
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000013', 'pending')    -- River (pending)
on conflict (group_id, user_id) do nothing;

-- Group 5: forming (2 confirmed) — Jade's group
insert into groups (id, event_id, name, status, created_by) values
  ('b0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'Chill & shoot', 'open', 'a0000000-0000-0000-0000-000000000014')
on conflict (id) do nothing;

insert into group_members (group_id, user_id, status) values
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000014', 'confirmed'), -- Jade (creator)
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000018', 'confirmed'), -- Remi
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'pending')    -- Leo (pending, cross-event)
on conflict (group_id, user_id) do nothing;

-- Leo, Priya, Felix, Sienna are not in a group for this event (looking)
