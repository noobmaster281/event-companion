-- Fix messages insert policy to match the chat unlock threshold (2 confirmed members)
-- rather than requiring the group itself to be in 'confirmed' status (which only
-- happens at 3 members via the auto-confirm trigger).
-- The security guarantee is: you must be a confirmed member of the group.

drop policy if exists "messages_insert_confirmed" on messages;

create policy "messages_insert_confirmed" on messages for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from group_members gm
    where gm.group_id = messages.group_id
    and gm.user_id = auth.uid()
    and gm.status = 'confirmed'
  )
);