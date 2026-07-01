alter table events add column if not exists photo_url  text;
alter table events add column if not exists ticket_url text;

-- Backfill the dev seed event
update events
set
  photo_url  = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
  ticket_url = 'https://example.com/tickets/testfest-2025'
where id = '00000000-0000-0000-0000-000000000002';
