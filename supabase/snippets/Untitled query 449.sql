-- Enable RLS (if not already enabled)
alter table public.profiles enable row level security;

-- Allow a logged-in user to SELECT their own profile row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (user_id = auth.uid());

-- Allow a logged-in user to INSERT their own profile row
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (user_id = auth.uid());

-- Allow a logged-in user to UPDATE their own profile row
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (user_id = auth.uid());
