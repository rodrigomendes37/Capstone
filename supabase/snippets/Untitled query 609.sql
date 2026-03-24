select user_id, team_id, date, created_at
from public.checkins
order by created_at desc;