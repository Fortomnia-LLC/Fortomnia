create table public.nutrition_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null default current_date,
  consumed_at timestamptz not null default now(),
  meal_type text not null
    check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name text not null
    check (char_length(trim(food_name)) > 0),
  serving_description text,
  calories integer not null default 0
    check (calories between 0 and 10000),
  protein_g numeric(8, 2) not null default 0
    check (protein_g between 0 and 2000),
  carbs_g numeric(8, 2) not null default 0
    check (carbs_g between 0 and 2000),
  fat_g numeric(8, 2) not null default 0
    check (fat_g between 0 and 2000),
  fiber_g numeric(8, 2) not null default 0
    check (fiber_g between 0 and 500),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index nutrition_entries_user_date_idx
  on public.nutrition_entries (
    user_id,
    entry_date desc,
    consumed_at desc
  );

create table public.nutrition_goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  calorie_target integer not null default 2000
    check (calorie_target between 500 and 10000),
  protein_target_g numeric(8, 2) not null default 150
    check (protein_target_g between 0 and 2000),
  carbs_target_g numeric(8, 2) not null default 200
    check (carbs_target_g between 0 and 2000),
  fat_target_g numeric(8, 2) not null default 70
    check (fat_target_g between 0 and 2000),
  fiber_target_g numeric(8, 2) not null default 25
    check (fiber_target_g between 0 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.nutrition_entries enable row level security;
alter table public.nutrition_goals enable row level security;

revoke all on table public.nutrition_entries from anon;
revoke all on table public.nutrition_entries from authenticated;
grant select, insert, update, delete
  on table public.nutrition_entries to authenticated;

revoke all on table public.nutrition_goals from anon;
revoke all on table public.nutrition_goals from authenticated;
grant select, insert, update, delete
  on table public.nutrition_goals to authenticated;

create policy "Users can view their own nutrition entries"
  on public.nutrition_entries
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own nutrition entries"
  on public.nutrition_entries
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own nutrition entries"
  on public.nutrition_entries
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own nutrition entries"
  on public.nutrition_entries
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can view their own nutrition goals"
  on public.nutrition_goals
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own nutrition goals"
  on public.nutrition_goals
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own nutrition goals"
  on public.nutrition_goals
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own nutrition goals"
  on public.nutrition_goals
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
