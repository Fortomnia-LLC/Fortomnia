alter table public.workout_sets
  drop constraint if exists workout_sets_duration_seconds_check;

alter table public.workout_sets
  add constraint workout_sets_duration_seconds_check
    check (
      (performance_type = 'time' and duration_seconds is not null and duration_seconds > 0)
      or
      (performance_type in ('reps', 'distance', 'calories', 'rounds') and duration_seconds is null)
    );

alter table public.workout_template_exercises
  drop constraint if exists workout_template_exercises_duration_check;

alter table public.workout_template_exercises
  add constraint workout_template_exercises_duration_check
    check (
      (performance_type = 'time' and target_duration_seconds between 1 and 86400)
      or
      (performance_type in ('reps', 'distance', 'calories', 'rounds') and target_duration_seconds is null)
    );

alter table public.workout_session_exercises
  drop constraint if exists workout_session_exercises_duration_check;

alter table public.workout_session_exercises
  add constraint workout_session_exercises_duration_check
    check (
      (performance_type = 'time' and target_duration_seconds between 1 and 86400)
      or
      (performance_type in ('reps', 'distance', 'calories', 'rounds') and target_duration_seconds is null)
    );

with missing_exercises (
  name, muscle_group, equipment, aliases, secondary_muscles,
  movement_pattern, instructions, is_unilateral
) as (
  values
    (
      'Plank Hold',
      'Core',
      'Bodyweight',
      array['front plank', 'plank']::text[],
      array['Shoulders', 'Glutes']::text[],
      'isolation',
      'Brace from shoulders through heels and hold a neutral trunk without letting the hips sag or rise.',
      false
    ),
    (
      'Bodyweight AMRAP',
      'Full Body',
      'Bodyweight',
      array['amrap', 'bodyweight circuit']::text[],
      array['Core', 'Legs', 'Shoulders']::text[],
      'conditioning',
      'Complete repeatable rounds of the selected bodyweight movements with consistent technique.',
      false
    )
)
insert into public.exercises (
  name, muscle_group, equipment, aliases, secondary_muscles,
  movement_pattern, instructions, is_unilateral, owner_id
)
select
  v.name, v.muscle_group, v.equipment, v.aliases, v.secondary_muscles,
  v.movement_pattern, v.instructions, v.is_unilateral, null
from missing_exercises v
where not exists (
  select 1
  from public.exercises e
  where e.owner_id is null and lower(e.name) = lower(v.name)
);
