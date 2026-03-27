select id, title, assigned_date, created_at
from public.workout_assignments
order by assigned_date asc, created_at desc;