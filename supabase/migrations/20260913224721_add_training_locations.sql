create table public.training_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  location_type text not null check (location_type in ('home', 'gym', 'hotel', 'outdoor', 'other')),
  equipment text[] not null check (
    cardinality(equipment) between 1 and 10
    and equipment <@ array['full_gym', 'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'band', 'cardio', 'functional']::text[]
  ),
  notes text check (notes is null or char_length(notes) <= 500),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.training_locations enable row level security;

revoke all on table public.training_locations from anon;
revoke all on table public.training_locations from authenticated;
grant select, insert, update, delete on table public.training_locations to authenticated;

create policy "Users can view their training locations"
  on public.training_locations for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can add their training locations"
  on public.training_locations for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their training locations"
  on public.training_locations for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can remove their training locations"
  on public.training_locations for delete to authenticated
  using (user_id = (select auth.uid()));

create index training_locations_user_idx
  on public.training_locations(user_id, updated_at desc);

create unique index training_locations_one_active_idx
  on public.training_locations(user_id) where is_active;

create function public.set_active_training_location(location_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.training_locations
    where id = location_id and user_id = (select auth.uid())
  ) then
    raise exception 'Training location not found';
  end if;

  update public.training_locations
    set is_active = false, updated_at = now()
    where user_id = (select auth.uid()) and is_active;

  update public.training_locations
    set is_active = true, updated_at = now()
    where id = location_id and user_id = (select auth.uid());
end;
$$;

revoke all on function public.set_active_training_location(uuid) from public;
grant execute on function public.set_active_training_location(uuid) to authenticated;
