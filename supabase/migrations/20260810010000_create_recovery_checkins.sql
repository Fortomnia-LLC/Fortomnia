create table public.daily_recovery_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  checkin_date date not null default current_date,
  sleep_duration_minutes integer not null
    check (sleep_duration_minutes between 0 and 1440),
  sleep_quality integer not null
    check (sleep_quality between 1 and 5),
  energy_level integer not null
    check (energy_level between 1 and 5),
  muscle_soreness integer not null
    check (muscle_soreness between 1 and 5),
  stress_level integer not null
    check (stress_level between 1 and 5),
  mood integer not null
    check (mood between 1 and 5),
  body_weight numeric(8, 2)
    check (body_weight between 20 and 1500),
  body_weight_unit text
    check (body_weight_unit in ('lb', 'kg')),
  notes text
    check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    (body_weight is null and body_weight_unit is null)
    or (body_weight is not null and body_weight_unit is not null)
  ),
  unique (user_id, checkin_date)
);


alter table public.daily_recovery_checkins enable row level security;

revoke all on table public.daily_recovery_checkins from anon;
revoke all on table public.daily_recovery_checkins from authenticated;
grant select, insert, update, delete
  on table public.daily_recovery_checkins to authenticated;

create policy "Users can view their own recovery check-ins"
  on public.daily_recovery_checkins
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own recovery check-ins"
  on public.daily_recovery_checkins
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own recovery check-ins"
  on public.daily_recovery_checkins
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own recovery check-ins"
  on public.daily_recovery_checkins
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
