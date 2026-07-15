-- ============================================================
-- STORAGE: profile-photos bucket RLS
-- ============================================================
-- Run after creating the 'profile-photos' bucket in the Supabase dashboard.

create policy "profile_photos_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "profile_photos_update"
  on storage.objects for update
  using (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "profile_photos_select"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

-- ============================================================
-- Add age, bio, gender to users
alter table users
  add column if not exists age     int check (age >= 18),
  add column if not exists bio     text check (char_length(bio) <= 160),
  add column if not exists gender  text check (gender in ('male', 'female', 'non-binary', 'prefer-not-to-say'));

-- Add max_size to groups (defaults to 5 per product spec)
alter table groups
  add column if not exists max_size int not null default 5 check (max_size between 2 and 20);

-- Reports table
create table if not exists reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references users(id) on delete cascade,
  reported_id uuid not null references users(id) on delete cascade,
  reason      text,
  created_at  timestamptz not null default now(),
  unique (reporter_id, reported_id)
);

alter table reports enable row level security;

create policy "reports_insert_self" on reports
  for insert with check (auth.uid() = reporter_id);

create policy "reports_select_self" on reports
  for select using (auth.uid() = reporter_id);

-- Blocks table
create table if not exists blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references users(id) on delete cascade,
  blocked_id  uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

alter table blocks enable row level security;

create policy "blocks_insert_self" on blocks
  for insert with check (auth.uid() = blocker_id);

create policy "blocks_select_self" on blocks
  for select using (auth.uid() = blocker_id);

create policy "blocks_delete_self" on blocks
  for delete using (auth.uid() = blocker_id);

-- Group invites table (for "invite to my group" feature)
create table if not exists group_invites (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references groups(id) on delete cascade,
  inviter_id  uuid not null references users(id) on delete cascade,
  invitee_id  uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (group_id, invitee_id)
);

alter table group_invites enable row level security;

create policy "group_invites_insert_member" on group_invites
  for insert with check (
    auth.uid() = inviter_id
    and exists (
      select 1 from group_members gm
      where gm.group_id = group_invites.group_id
      and gm.user_id = auth.uid()
      and gm.status = 'confirmed'
    )
  );

create policy "group_invites_select_invitee" on group_invites
  for select using (auth.uid() = invitee_id or auth.uid() = inviter_id);
