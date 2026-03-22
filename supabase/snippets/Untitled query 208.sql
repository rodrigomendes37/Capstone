insert into public.teams (name)
values ('UNCA Mens Soccer')
on conflict (name) do nothing;