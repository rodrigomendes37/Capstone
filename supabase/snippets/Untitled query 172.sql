select id, title, event_date, assignment_id
from public.calendar_events
order by created_at desc;