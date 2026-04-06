drop policy if exists "profiles_coach_read_team" on public.profiles;

create policy "profiles_coach_read_team"
on public.profiles
for select
using (
  exists (
    select 1
    from public.team_memberships coach_tm
    join public.team_memberships athlete_tm
      on coach_tm.team_id = athlete_tm.team_id
    where coach_tm.user_id = auth.uid()
      and coach_tm.role = 'coach'
      and athlete_tm.user_id = profiles.user_id
  )
);