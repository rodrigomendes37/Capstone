select
  tm.user_id as athlete_user_id,
  tm.team_id,
  c.user_id as checkin_user_id,
  c.team_id as checkin_team_id,
  c.date,
  c.created_at
from public.team_memberships tm
left join public.checkins c
  on c.user_id = tm.user_id
  and c.team_id = tm.team_id
where tm.role = 'athlete'
order by c.created_at desc nulls last;