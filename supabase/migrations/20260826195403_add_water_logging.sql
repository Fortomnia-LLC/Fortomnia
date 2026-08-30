alter table public.nutrition_goals
  add column water_target_ml integer
    check (water_target_ml between 250 and 20000);

create table public.water_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null default current_date,
  amount_ml integer not null check (amount_ml between 1 and 10000),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index water_entries_user_date_idx
  on public.water_entries (
    user_id,
    entry_date desc,
    logged_at desc
  );

alter table public.water_entries enable row level security;

revoke all on table public.water_entries from anon;
revoke all on table public.water_entries from authenticated;
grant select, insert, update, delete
  on table public.water_entries to authenticated;

create policy "Users can view their own water entries"
  on public.water_entries
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own water entries"
  on public.water_entries
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own water entries"
  on public.water_entries
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own water entries"
  on public.water_entries
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
