-- ============================================================
-- REPORTS: new columns
-- ============================================================
alter table reports
  add column if not exists details        text,
  add column if not exists event_id       uuid references events(id) on delete set null,
  add column if not exists message_id     uuid references messages(id) on delete set null,
  add column if not exists status         text not null default 'open',
  add column if not exists resolver_notes text,
  add column if not exists resolved_at    timestamptz;

-- Backfill any pre-existing out-of-range reason values before constraining
-- (this table already has live rows from the old free-text reason field).
update reports
set reason = 'other'
where reason is null
   or reason not in ('harassment', 'inappropriate-messages', 'fake-or-impersonation', 'spam', 'safety-concern', 'other');

alter table reports
  alter column reason set not null,
  add constraint reports_reason_check check (
    reason in ('harassment', 'inappropriate-messages', 'fake-or-impersonation', 'spam', 'safety-concern', 'other')
  ),
  add constraint reports_status_check check (
    status in ('open', 'reviewing', 'resolved', 'dismissed')
  ),
  add constraint reports_details_len check (details is null or char_length(details) <= 1000),
  add constraint reports_no_self_report check (reporter_id <> reported_id);

-- Required for the "re-report = update existing row" upsert pattern in the API route.
-- Without an UPDATE policy, ON CONFLICT DO UPDATE is rejected by RLS even
-- though the original INSERT WITH CHECK would pass.
create policy "reports_update_self" on reports
  for update using (auth.uid() = reporter_id) with check (auth.uid() = reporter_id);

-- ============================================================
-- BLOCKS: guard rail
-- ============================================================
alter table blocks
  add constraint blocks_no_self_block check (blocker_id <> blocked_id);

-- ============================================================
-- blocked_user_ids(): bidirectional lookup, RPC'd from server components
-- ============================================================
-- SECURITY DEFINER is required: blocks_select_self only lets a caller see
-- rows where *they* are the blocker. "Has someone blocked me" (the reverse
-- direction) is exactly what feed/profile/chat hiding needs too, and RLS
-- would otherwise hide those rows from the function. The `me` argument is
-- hard-checked against auth.uid() so no caller can query someone else's
-- block graph via this bypass.
create or replace function blocked_user_ids(me uuid)
returns table(uid uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if me is distinct from auth.uid() then
    raise exception 'not authorized';
  end if;

  return query
    select blocked_id as uid from blocks where blocker_id = me
    union
    select blocker_id as uid from blocks where blocked_id = me;
end;
$$;

revoke all on function blocked_user_ids(uuid) from public;
grant execute on function blocked_user_ids(uuid) to authenticated;

-- ============================================================
-- GROUP_MEMBERS: delete policies
-- ============================================================
-- (1) Self-delete — needed for block-driven "leave shared group" cleanup.
create policy "group_members_delete_self" on group_members
  for delete using (auth.uid() = user_id);

-- (2) Creator-delete — bundled fix, not new feature scope. GroupManager's
-- decline() has called delete() as the creator against another user's row
-- since this table existed, with no matching policy ever added (verified:
-- no DELETE policy exists on group_members in 001, 002, 004, or 005). That
-- almost certainly makes decline() a silent no-op today. This policy fixes
-- it, and is also needed so a creator's cleanup of a blocked user's pending
-- request works.
create policy "group_members_delete_creator" on group_members
  for delete using (
    exists (select 1 from groups g where g.id = group_id and g.created_by = auth.uid())
  );

-- (3) Insert-time block guard — defense in depth against a client that
-- skips the app-layer check. MUST be RESTRICTIVE: Postgres OR-combines
-- multiple PERMISSIVE policies for the same command, so a second permissive
-- INSERT policy would *weaken* group_members_insert_self instead of adding
-- a requirement. A restrictive policy ANDs with it instead.
create policy "group_members_insert_not_blocked" on group_members
  as restrictive
  for insert
  with check (
    not exists (
      select 1 from groups g
      join blocks b on (b.blocker_id = g.created_by and b.blocked_id = auth.uid())
                    or (b.blocker_id = auth.uid() and b.blocked_id = g.created_by)
      where g.id = group_id
    )
  );
