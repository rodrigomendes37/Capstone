alter table public.checkins enable row level security;

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