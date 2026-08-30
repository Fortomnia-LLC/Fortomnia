create index if not exists supplement_logs_protocol_id_user_id_idx
  on public.supplement_logs (protocol_id, user_id);

create index if not exists workout_session_exercises_exercise_id_idx
  on public.workout_session_exercises (exercise_id);

create index if not exists workout_session_exercises_session_id_user_id_idx
  on public.workout_session_exercises (session_id, user_id);

create index if not exists workout_session_exercises_user_id_idx
  on public.workout_session_exercises (user_id);

create index if not exists workout_sets_exercise_id_idx
  on public.workout_sets (exercise_id);

create index if not exists workout_sets_session_id_user_id_idx
  on public.workout_sets (session_id, user_id);

create index if not exists workout_template_exercises_exercise_id_idx
  on public.workout_template_exercises (exercise_id);

create index if not exists workout_template_exercises_template_id_user_id_idx
  on public.workout_template_exercises (template_id, user_id);

create index if not exists workout_template_exercises_user_id_idx
  on public.workout_template_exercises (user_id);
