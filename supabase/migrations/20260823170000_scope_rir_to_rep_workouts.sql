alter table public.workout_template_exercises
  alter column target_rir drop not null;

alter table public.workout_session_exercises
  alter column target_rir drop not null;

update public.workout_template_exercises
set target_rir = null
where performance_type <> 'reps';

update public.workout_session_exercises
set target_rir = null
where performance_type <> 'reps';

alter table public.workout_template_exercises
  drop constraint if exists workout_template_exercises_rir_consistency_check,
  add constraint workout_template_exercises_rir_consistency_check
    check (
      (performance_type = 'reps' and target_rir is not null)
      or
      (performance_type <> 'reps' and target_rir is null)
    );

alter table public.workout_session_exercises
  drop constraint if exists workout_session_exercises_rir_consistency_check,
  add constraint workout_session_exercises_rir_consistency_check
    check (
      (performance_type = 'reps' and target_rir is not null)
      or
      (performance_type <> 'reps' and target_rir is null)
    );
