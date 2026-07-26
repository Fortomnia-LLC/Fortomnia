create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create unique index workout_templates_user_name_unique
  on public.workout_templates (user_id, lower(name));

create index workout_templates_user_created_idx
  on public.workout_templates (user_id, created_at desc);

create table public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  position integer not null check (position > 0),
  target_sets integer not null default 3
    check (target_sets between 1 and 20),
  rep_min integer not null default 8
    check (rep_min between 1 and 100),
  rep_max integer not null default 12
    check (rep_max between 1 and 100),
  target_rir integer not null default 2
    check (target_rir between 0 and 10),
  created_at timestamptz not null default now(),

  foreign key (template_id, user_id)
    references public.workout_templates (id, user_id)
    on delete cascade,

  check (rep_min <= rep_max),
  unique (template_id, position),
  unique (template_id, exercise_id)
);

create index workout_template_exercises_template_position_idx
  on public.workout_template_exercises (template_id, position);

alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;

revoke all on table public.workout_templates from anon;
revoke all on table public.workout_templates from authenticated;
grant select, insert, update, delete
  on table public.workout_templates to authenticated;

revoke all on table public.workout_template_exercises from anon;
revoke all on table public.workout_template_exercises from authenticated;
grant select, insert, update, delete
  on table public.workout_template_exercises to authenticated;

create policy "Users can view their own workout templates"
  on public.workout_templates
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own workout templates"
  on public.workout_templates
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own workout templates"
  on public.workout_templates
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own workout templates"
  on public.workout_templates
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can view their own template exercises"
  on public.workout_template_exercises
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own template exercises"
  on public.workout_template_exercises
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

create policy "Users can update their own template exercises"
  on public.workout_template_exercises
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

create policy "Users can delete their own template exercises"
  on public.workout_template_exercises
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
