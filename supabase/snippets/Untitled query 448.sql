delete from public.workout_assignments
where id not in (
  select assignment_id
  from public.calendar_events
  where assignment_id is not null
);