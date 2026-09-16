create index workout_sets_exercise_variant_exercise_idx
  on public.workout_sets(exercise_variant_id, exercise_id)
  where exercise_variant_id is not null;
