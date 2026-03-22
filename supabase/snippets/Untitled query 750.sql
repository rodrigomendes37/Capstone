insert into public.profiles (user_id, role, user_type)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'role', 'athlete'),
  coalesce(u.raw_user_meta_data->>'role', 'athlete')
from auth.users u
left join public.profiles p
  on p.user_id = u.id
where p.user_id is null;