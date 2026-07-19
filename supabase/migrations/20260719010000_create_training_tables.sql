create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  muscle_group text not null,
  equipment text,
  created_at timestamptz not null default now()
);

create unique index exercises_builtin_name_unique
  on public.exercises (lower(name))
  where owner_id is null;

create unique index exercises_owner_name_unique
  on public.exercises (owner_id, lower(name))
  where owner_id is not null;

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  set_number integer not null check (set_number > 0),
  reps integer not null check (reps > 0),
  weight numeric(8, 2) not null default 0 check (weight >= 0),
  weight_unit text not null default 'lb'
    check (weight_unit in ('lb', 'kg')),
  reps_in_reserve integer
    check (reps_in_reserve between 0 and 10),
  notes text,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  foreign key (session_id, user_id)
    references public.workout_sessions (id, user_id)
    on delete cascade,

  unique (session_id, exercise_id, set_number)
);

create index workout_sessions_user_started_idx
  on public.workout_sessions (user_id, started_at desc);

create index workout_sets_user_exercise_idx
  on public.workout_sets (user_id, exercise_id, performed_at desc);

alter table public.exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;

revoke all on table public.exercises from anon;
revoke all on table public.exercises from authenticated;
grant select, insert, update, delete
  on table public.exercises to authenticated;

revoke all on table public.workout_sessions from anon;
revoke all on table public.workout_sessions from authenticated;
grant select, insert, update, delete
  on table public.workout_sessions to authenticated;

revoke all on table public.workout_sets from anon;
revoke all on table public.workout_sets from authenticated;
grant select, insert, update, delete
  on table public.workout_sets to authenticated;

create policy "Users can view built-in and owned exercises"
  on public.exercises
  for select
  to authenticated
  using (
    owner_id is null
    or owner_id = (select auth.uid())
  );

create policy "Users can create their own exercises"
  on public.exercises
  for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Users can update their own exercises"
  on public.exercises
  for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Users can delete their own exercises"
  on public.exercises
  for delete
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "Users can view their own workout sessions"
  on public.workout_sessions
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own workout sessions"
  on public.workout_sessions
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own workout sessions"
  on public.workout_sessions
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own workout sessions"
  on public.workout_sessions
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can view their own workout sets"
  on public.workout_sets
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own workout sets"
  on public.workout_sets
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.exercises
      where exercises.id = exercise_id
        and (
          exercises.owner_id is null
          or exercises.owner_id = (select auth.uid())
        )
    )
  );

create policy "Users can update their own workout sets"
  on public.workout_sets
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.exercises
      where exercises.id = exercise_id
        and (
          exercises.owner_id is null
          or exercises.owner_id = (select auth.uid())
        )
    )
  );

create policy "Users can delete their own workout sets"
  on public.workout_sets
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

insert into public.exercises (name, muscle_group, equipment)
values
  ('Barbell Bench Press', 'Chest', 'Barbell'),
  ('Back Squat', 'Quadriceps', 'Barbell'),
  ('Deadlift', 'Posterior Chain', 'Barbell'),
  ('Overhead Press', 'Shoulders', 'Barbell'),
  ('Barbell Row', 'Back', 'Barbell'),
  ('Pull-Up', 'Back', 'Bodyweight'),
  ('Lat Pulldown', 'Back', 'Cable'),
  ('Leg Press', 'Quadriceps', 'Machine'),
  ('Romanian Deadlift', 'Hamstrings', 'Barbell'),
  ('Dumbbell Curl', 'Biceps', 'Dumbbell'),
  ('Triceps Pushdown', 'Triceps', 'Cable');
