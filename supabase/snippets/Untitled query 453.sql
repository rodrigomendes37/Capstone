alter table public.calendar_events
add column if not exists recurrence_group_id uuid;

alter table public.calendar_events
add column if not exists recurrence_type text default 'none';

alter table public.calendar_events
add column if not exists recurrence_until date;

alter table public.calendar_events
add column if not exists recurrence_days text[] default '{}';