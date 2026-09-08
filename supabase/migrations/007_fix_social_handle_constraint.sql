-- The original at_least_one_social CHECK constraint (001_initial_schema.sql)
-- applied unconditionally, blocking every brand-new signup — a fresh user
-- row from /api/verify-token has no social handles yet by definition. The
-- constraint's own comment says it should "only be enforced when
-- profile_complete = true via trigger below," but that trigger was never
-- actually written. This migration implements it properly.

alter table users drop constraint if exists at_least_one_social;

create or replace function enforce_social_handle_on_complete()
returns trigger language plpgsql as $$
begin
  if new.profile_complete
     and new.instagram_handle is null
     and new.tiktok_handle is null
     and new.snapchat_handle is null
  then
    raise exception 'at_least_one_social'
      using hint = 'At least one social handle is required to complete a profile';
  end if;
  return new;
end;
$$;

create trigger trg_enforce_social_handle_on_complete
before insert or update on users
for each row execute function enforce_social_handle_on_complete();
