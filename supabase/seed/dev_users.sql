-- ============================================================
-- Dev seed: fake attendees, groups, and events
-- Run AFTER dev_seed.sql (which creates the operator and first event)
-- ============================================================
-- Uses the existing event: 00000000-0000-0000-0000-000000000002 (TestFest 2025)

-- ============================================================
-- FAKE AUTH USERS
-- auth.users is Supabase-managed, but in the SQL editor you can
-- insert directly. These won't be able to log in — they're just
-- for populating the feed visually.
-- ============================================================
insert into auth.users (
  id, email, email_confirmed_at, created_at, updated_at, aud, role,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) values
  ('a0000000-0000-0000-0000-000000000001', 'maya@example.com',    now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000002', 'leo@example.com',     now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000003', 'priya@example.com',   now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000004', 'cam@example.com',     now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000005', 'jess@example.com',    now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000006', 'marcus@example.com',  now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000007', 'nina@example.com',    now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000008', 'felix@example.com',   now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000009', 'zoey@example.com',    now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000010', 'omar@example.com',    now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000011', 'elena@example.com',   now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false),
  ('a0000000-0000-0000-0000-000000000012', 'sam@example.com',     now(), now(), now(), 'authenticated', 'authenticated', '{"provider":"email"}', '{}', false)
on conflict (id) do nothing;

-- ============================================================
-- PUBLIC USER PROFILES
-- ============================================================
insert into users (id, email, name, vibe_tags, group_size_preference, instagram_handle, tiktok_handle, snapchat_handle, profile_complete) values
  ('a0000000-0000-0000-0000-000000000001', 'maya@example.com',   'Maya',   '{dance-all-night,here-for-headliners}',         4, 'maya.festival', null,             null,          true),
  ('a0000000-0000-0000-0000-000000000002', 'leo@example.com',    'Leo',    '{discover-new-artists,chill-vibes}',             3, null,            'leomusicvids',   null,          true),
  ('a0000000-0000-0000-0000-000000000003', 'priya@example.com',  'Priya',  '{photographer,festival-foodie}',                 2, 'priya.shoots',  null,             null,          true),
  ('a0000000-0000-0000-0000-000000000004', 'cam@example.com',    'Cam',    '{front-row-energy,dance-all-night}',             5, 'cam_lives',     null,             null,          true),
  ('a0000000-0000-0000-0000-000000000005', 'jess@example.com',   'Jess',   '{chill-vibes,discover-new-artists,first-timer}', 3, null,            null,             'jess.snap',   true),
  ('a0000000-0000-0000-0000-000000000006', 'marcus@example.com', 'Marcus', '{here-for-headliners,front-row-energy}',         6, 'marcusbeats',   null,             null,          true),
  ('a0000000-0000-0000-0000-000000000007', 'nina@example.com',   'Nina',   '{first-timer,chill-vibes}',                      3, null,            'ninadances',     null,          true),
  ('a0000000-0000-0000-0000-000000000008', 'felix@example.com',  'Felix',  '{discover-new-artists,photographer}',            4, 'felixframes',   null,             null,          true),
  ('a0000000-0000-0000-0000-000000000009', 'zoey@example.com',   'Zoey',   '{dance-all-night,festival-foodie}',              4, null,            'zoeydances',     null,          true),
  ('a0000000-0000-0000-0000-000000000010', 'omar@example.com',   'Omar',   '{here-for-headliners,discover-new-artists}',     5, 'omar.live',     null,             null,          true),
  ('a0000000-0000-0000-0000-000000000011', 'elena@example.com',  'Elena',  '{front-row-energy,dance-all-night,first-timer}', 3, null,            'elena.frontrow', null,          true),
  ('a0000000-0000-0000-0000-000000000012', 'sam@example.com',    'Sam',    '{photographer,festival-foodie,chill-vibes}',     2, 'samshots_',     null,             null,          true)
on conflict (id) do nothing;

-- ============================================================
-- VERIFIED BADGES (all for TestFest 2025)
-- ============================================================
insert into verified_badges (user_id, event_id) values
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002'),
  ('a0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002')
on conflict (user_id, event_id) do nothing;

-- ============================================================
-- GROUPS
-- ============================================================

-- Group 1: confirmed (3 members) — Maya's crew
insert into groups (id, event_id, name, status, created_by) values
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Mainstage crew', 'confirmed', 'a0000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into group_members (group_id, user_id, status) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'confirmed'), -- Maya (creator)
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'confirmed'), -- Cam
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000006', 'confirmed'), -- Marcus
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000011', 'pending')   -- Elena (pending)
on conflict (group_id, user_id) do nothing;

-- Group 2: forming (2 confirmed) — Leo's group
insert into groups (id, event_id, name, status, created_by) values
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', null, 'open', 'a0000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;

insert into group_members (group_id, user_id, status) values
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'confirmed'), -- Leo (creator)
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000009', 'confirmed'), -- Zoey
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000010', 'pending')    -- Omar (pending)
on conflict (group_id, user_id) do nothing;

-- Group 3: forming (1 confirmed) — Nina just started one
insert into groups (id, event_id, name, status, created_by) values
  ('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Chill zone squad', 'open', 'a0000000-0000-0000-0000-000000000007')
on conflict (id) do nothing;

insert into group_members (group_id, user_id, status) values
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000007', 'confirmed') -- Nina (creator, alone)
on conflict (group_id, user_id) do nothing;

-- Priya, Jess, Felix, Sam, Omar are not in a group (looking)