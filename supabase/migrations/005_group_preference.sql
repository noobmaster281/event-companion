-- Add group_preference to users
alter table public.users
  add column if not exists group_preference text
    check (group_preference in ('open', 'male', 'female', 'mixed'));
