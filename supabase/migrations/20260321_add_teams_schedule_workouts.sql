-- =========================
-- TEAMS
-- =========================

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('athlete', 'coach')),
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create index if not exists idx_team_memberships_team_id on public.team_memberships(team_id);
create index if not exists idx_team_memberships_user_id on public.team_memberships(user_id);

-- =========================
-- CALENDAR EVENTS
-- =========================

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('personal', 'team')),
  title text not null,
  event_date date not null,
  time_label text,
  hour integer not null check (hour >= 0 and hour <= 23),
  duration numeric not null default 1,
  created_at timestamptz not null default now(),
  check (
    (scope = 'team' and team_id is not null) or
    (scope = 'personal')
  )
);

create index if not exists idx_calendar_events_team_id on public.calendar_events(team_id);
create index if not exists idx_calendar_events_created_by on public.calendar_events(created_by);
create index if not exists idx_calendar_events_event_date on public.calendar_events(event_date);

-- =========================
-- WORKOUT ASSIGNMENTS
-- coach creates these for a team/date
-- =========================

create table if not exists public.workout_assignments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  assigned_date date not null,
  notes text default '',
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_workout_assignments_team_id on public.workout_assignments(team_id);
create index if not exists idx_workout_assignments_assigned_date on public.workout_assignments(assigned_date);

-- =========================
-- WORKOUT LOGS
-- athlete submits performance for an assignment
-- =========================

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.workout_assignments(id) on delete cascade,
  athlete_user_id uuid not null references auth.users(id) on delete cascade,
  submission jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  unique (assignment_id, athlete_user_id)
);

create index if not exists idx_workout_logs_assignment_id on public.workout_logs(assignment_id);
create index if not exists idx_workout_logs_athlete_user_id on public.workout_logs(athlete_user_id);