create schema if not exists private;

revoke all on schema private from public;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_weight_unit text not null default 'lb'
    check (preferred_weight_unit in ('lb', 'kg')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;

grant select, insert, update on table public.profiles to authenticated;

drop policy if exists "Users can view their own profile"
  on public.profiles;

create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can create their own profile"
  on public.profiles;

create policy "Users can create their own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile"
  on public.profiles;

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_profile_after_signup
  on auth.users;

create trigger create_profile_after_signup
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

insert into public.profiles (id, display_name)
select
  id,
  raw_user_meta_data ->> 'display_name'
from auth.users
on conflict (id) do nothing;
