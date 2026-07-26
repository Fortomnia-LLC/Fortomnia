create table public.workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  position integer not null check (position > 0),
  target_sets integer not null check (target_sets between 1 and 20),
  rep_min integer not null check (rep_min between 1 and 100),
  rep_max integer not null check (rep_max between 1 and 100),
  target_rir integer not null check (target_rir between 0 and 10),
  created_at timestamptz not null default now(),

  foreign key (session_id, user_id)
    references public.workout_sessions (id, user_id)
    on delete cascade,

  check (rep_min <= rep_max),
  unique (session_id, position),
  unique (session_id, exercise_id)
);

create index workout_session_exercises_session_position_idx
  on public.workout_session_exercises (session_id, position);

alter table public.workout_session_exercises enable row level security;

revoke all on table public.workout_session_exercises from anon;
revoke all on table public.workout_session_exercises from authenticated;
grant select, insert, update, delete
  on table public.workout_session_exercises to authenticated;

create policy "Users can view their own session exercises"
  on public.workout_session_exercises
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own session exercises"
  on public.workout_session_exercises
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

create policy "Users can update their own session exercises"
  on public.workout_session_exercises
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

create policy "Users can delete their own session exercises"
  on public.workout_session_exercises
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
