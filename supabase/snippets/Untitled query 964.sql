alter table public.calendar_events
add column if not exists assignment_id uuid references public.workout_assignments(id) on delete cascade;