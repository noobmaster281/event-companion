-- ============================================================
-- One confirmed group per event per user
-- ============================================================

-- BEFORE trigger: reject the insert/update if the user is already
-- confirmed in a different group for the same event.
create or replace function enforce_one_group_per_event()
returns trigger language plpgsql as $$
declare
  v_event_id uuid;
  existing_count int;
begin
  if NEW.status = 'confirmed' then
    select event_id into v_event_id
    from groups
    where id = NEW.group_id;

    select count(*) into existing_count
    from group_members gm
    join groups g on g.id = gm.group_id
    where gm.user_id    = NEW.user_id
      and gm.status     = 'confirmed'
      and g.event_id    = v_event_id
      and gm.group_id  != NEW.group_id;

    if existing_count > 0 then
      raise exception 'already_in_group'
        using hint = 'User is already a confirmed member of another group for this event';
    end if;
  end if;
  return NEW;
end;
$$;

create trigger trg_enforce_one_group_per_event
before insert or update on group_members
for each row execute function enforce_one_group_per_event();


-- ============================================================
-- Cancel pending requests to other groups when confirmed
-- ============================================================

-- AFTER trigger: once a row becomes confirmed, delete all pending
-- rows for the same user in other groups for the same event.
create or replace function cancel_other_pending_requests()
returns trigger language plpgsql as $$
declare
  v_event_id uuid;
begin
  if NEW.status = 'confirmed' and (OLD is null or OLD.status != 'confirmed') then
    select event_id into v_event_id
    from groups
    where id = NEW.group_id;

    delete from group_members
    where user_id  = NEW.user_id
      and status   = 'pending'
      and group_id != NEW.group_id
      and group_id in (
        select id from groups where event_id = v_event_id
      );
  end if;
  return NEW;
end;
$$;

create trigger trg_cancel_pending_on_confirm
after insert or update on group_members
for each row execute function cancel_other_pending_requests();
