alter table public.workout_sets
  add column if not exists intensity_rpe smallint;

alter table public.workout_sets
  drop constraint if exists workout_sets_intensity_rpe_check;

alter table public.workout_sets
  add constraint workout_sets_intensity_rpe_check
  check (intensity_rpe is null or intensity_rpe between 1 and 10);
