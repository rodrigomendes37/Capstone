update public.profiles
set user_type = coalesce(user_type, role)
where user_id = '50d10342-2632-4523-a987-2bb207c5f061';

select * from public.profiles
where user_id = '50d10342-2632-4523-a987-2bb207c5f061';
