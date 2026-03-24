alter table public.checkins
add column if not exists team_id uuid references public.teams(id);