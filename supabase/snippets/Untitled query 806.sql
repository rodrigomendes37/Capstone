insert into public.team_memberships (team_id, user_id, role)
select t.id, 'e8f8e74a-a1ff-4850-b385-bc9667deb448', 'coach'
from public.teams t
where t.name = 'UNCA Mens Soccer'
on conflict (team_id, user_id) do nothing;

insert into public.team_memberships (team_id, user_id, role)
select t.id, 'a2dd2c03-b7ba-4a54-9e4e-ea7da3ebffce', 'athlete'
from public.teams t
where t.name = 'UNCA Mens Soccer'
on conflict (team_id, user_id) do nothing;