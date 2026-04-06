alter table public.checkins enable row level security;
alter table public.workout_assignments enable row level security;
alter table public.workout_logs enable row level security;

drop policy if exists "checkins_select_own" on public.checkins;
create policy "checkins_select_own"
on public.checkins
for select
using (user_id = auth.uid());

drop policy if exists "checkins_insert_own" on public.checkins;
create policy "checkins_insert_own"
on public.checkins
for insert
with check (user_id = auth.uid());

drop policy if exists "checkins_coach_read_team" on public.checkins;
create policy "checkins_coach_read_team"
on public.checkins
for select
using (
  exists (
    select 1
    from public.team_memberships coach_tm
    join public.team_memberships athlete_tm
      on coach_tm.team_id = athlete_tm.team_id
    where coach_tm.user_id = auth.uid()
      and coach_tm.role = 'coach'
      and athlete_tm.user_id = checkins.user_id
      and athlete_tm.team_id = checkins.team_id
  )
);

drop policy if exists "workout_assignments_team_read" on public.workout_assignments;
create policy "workout_assignments_team_read"
on public.workout_assignments
for select
using (
  exists (
    select 1
    from public.team_memberships tm
    where tm.user_id = auth.uid()
      and tm.team_id = workout_assignments.team_id
  )
);

drop policy if exists "workout_assignments_coach_insert" on public.workout_assignments;
create policy "workout_assignments_coach_insert"
on public.workout_assignments
for insert
with check (
  exists (
    select 1
    from public.team_memberships tm
    where tm.user_id = auth.uid()
      and tm.team_id = workout_assignments.team_id
      and tm.role = 'coach'
  )
);

drop policy if exists "workout_assignments_coach_update" on public.workout_assignments;
create policy "workout_assignments_coach_update"
on public.workout_assignments
for update
using (
  exists (
    select 1
    from public.team_memberships tm
    where tm.user_id = auth.uid()
      and tm.team_id = workout_assignments.team_id
      and tm.role = 'coach'
  )
);

drop policy if exists "workout_assignments_coach_delete" on public.workout_assignments;
create policy "workout_assignments_coach_delete"
on public.workout_assignments
for delete
using (
  exists (
    select 1
    from public.team_memberships tm
    where tm.user_id = auth.uid()
      and tm.team_id = workout_assignments.team_id
      and tm.role = 'coach'
  )
);

drop policy if exists "workout_logs_athlete_read_own" on public.workout_logs;
create policy "workout_logs_athlete_read_own"
on public.workout_logs
for select
using (athlete_user_id = auth.uid());

drop policy if exists "workout_logs_athlete_insert_own" on public.workout_logs;
create policy "workout_logs_athlete_insert_own"
on public.workout_logs
for insert
with check (athlete_user_id = auth.uid());

drop policy if exists "workout_logs_athlete_update_own" on public.workout_logs;
create policy "workout_logs_athlete_update_own"
on public.workout_logs
for update
using (athlete_user_id = auth.uid());

drop policy if exists "workout_logs_coach_read_team" on public.workout_logs;
create policy "workout_logs_coach_read_team"
on public.workout_logs
for select
using (
  exists (
    select 1
    from public.team_memberships coach_tm
    join public.workout_assignments wa
      on wa.id = workout_logs.assignment_id
    where coach_tm.user_id = auth.uid()
      and coach_tm.role = 'coach'
      and coach_tm.team_id = wa.team_id
  )
);