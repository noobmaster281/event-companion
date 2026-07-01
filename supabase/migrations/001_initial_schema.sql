-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- ============================================================
-- OPERATORS (festival partners)
-- ============================================================
create table operators (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  secret_key  text not null, -- HMAC-SHA256 secret for signing/verifying inbound tokens
  created_at  timestamptz not null default now()
);

-- ============================================================
-- EVENTS
-- ============================================================
create table events (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  festival_name text not null,
  operator_id   uuid not null references operators(id) on delete cascade,
  event_date    date,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table users (
  id                      uuid primary key references auth.users(id) on delete cascade,
  email                   text unique not null,
  name                    text,
  photo_url               text,
  vibe_tags               text[] not null default '{}',
  group_size_preference   int check (group_size_preference between 2 and 10),
  instagram_handle        text,
  tiktok_handle           text,
  snapchat_handle         text,
  profile_complete        boolean not null default false,
  created_at              timestamptz not null default now(),
  -- at least one social handle required — enforced at API layer, not DB constraint
  constraint at_least_one_social check (
    instagram_handle is not null
    or tiktok_handle is not null
    or snapchat_handle is not null
  ) -- only enforced when profile_complete = true via trigger below
);

-- ============================================================
-- VERIFIED BADGES
-- ============================================================
create table verified_badges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  event_id    uuid not null references events(id) on delete cascade,
  verified_at timestamptz not null default now(),
  unique (user_id, event_id)
);

-- ============================================================
-- GROUPS
-- ============================================================
create table groups (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  name        text,
  status      text not null default 'open' check (status in ('open', 'confirmed')),
  created_by  uuid not null references users(id),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- GROUP MEMBERS
-- ============================================================
create table group_members (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid not null references groups(id) on delete cascade,
  user_id   uuid not null references users(id) on delete cascade,
  status    text not null default 'pending' check (status in ('pending', 'confirmed')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

-- ============================================================
-- MESSAGES
-- ============================================================
create table messages (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references groups(id) on delete cascade,
  user_id    uuid not null references users(id),
  content    text not null check (length(content) > 0),
  created_at timestamptz not null default now()
);

-- ============================================================
-- AUTO-CONFIRM GROUP when member count hits 3
-- ============================================================
create or replace function check_group_confirmation()
returns trigger language plpgsql as $$
declare
  confirmed_count int;
begin
  select count(*) into confirmed_count
  from group_members
  where group_id = new.group_id and status = 'confirmed';

  if confirmed_count >= 3 then
    update groups set status = 'confirmed' where id = new.group_id;
  end if;

  return new;
end;
$$;

create trigger trg_group_confirmation
after insert or update on group_members
for each row execute function check_group_confirmation();

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_verified_badges_event  on verified_badges(event_id);
create index idx_verified_badges_user   on verified_badges(user_id);
create index idx_group_members_group    on group_members(group_id);
create index idx_group_members_user     on group_members(user_id);
create index idx_groups_event           on groups(event_id);
create index idx_messages_group         on messages(group_id);
create index idx_messages_created       on messages(group_id, created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table users           enable row level security;
alter table events          enable row level security;
alter table operators       enable row level security;
alter table verified_badges enable row level security;
alter table groups          enable row level security;
alter table group_members   enable row level security;
alter table messages        enable row level security;

-- Users: anyone can read profiles; only you can update yours
create policy "users_select_all"   on users for select using (true);
create policy "users_insert_self"  on users for insert with check (auth.uid() = id);
create policy "users_update_self"  on users for update using (auth.uid() = id);

-- Events: publicly readable
create policy "events_select_all"  on events for select using (true);

-- Operators: not directly exposed to users (service role only)
create policy "operators_none"     on operators for all using (false);

-- Verified badges: publicly readable so feed can show verification status
create policy "badges_select_all"  on verified_badges for select using (true);

-- Groups: readable by everyone in the event; create/update restricted
create policy "groups_select_all"  on groups for select using (true);
create policy "groups_insert_auth" on groups for insert with check (auth.uid() = created_by);
create policy "groups_update_creator" on groups for update using (auth.uid() = created_by);

-- Group members: members can see their own group; join requests are visible
create policy "group_members_select_all" on group_members for select using (true);
create policy "group_members_insert_self" on group_members for insert with check (auth.uid() = user_id);
create policy "group_members_update_group_creator" on group_members for update using (
  exists (
    select 1 from groups g
    where g.id = group_id and g.created_by = auth.uid()
  )
);

-- Messages: group members can read; confirmed members can write
create policy "messages_select_members" on messages for select using (
  exists (
    select 1 from group_members gm
    where gm.group_id = messages.group_id
    and gm.user_id = auth.uid()
    and gm.status = 'confirmed'
  )
);
create policy "messages_insert_confirmed" on messages for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from group_members gm
    join groups g on g.id = gm.group_id
    where gm.group_id = messages.group_id
    and gm.user_id = auth.uid()
    and gm.status = 'confirmed'
    and g.status = 'confirmed'
  )
);

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table group_members;
