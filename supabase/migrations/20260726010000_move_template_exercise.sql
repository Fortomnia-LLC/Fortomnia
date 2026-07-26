create or replace function public.move_workout_template_exercise(
  p_exercise_id uuid,
  p_direction text
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_exercise public.workout_template_exercises%rowtype;
  adjacent_exercise public.workout_template_exercises%rowtype;
  temporary_position integer;
begin
  if p_direction not in ('up', 'down') then
    raise exception 'Direction must be up or down';
  end if;

    select *
  into current_exercise
  from public.workout_template_exercises
  where id = p_exercise_id
    and user_id = (select auth.uid());

  if not found then
    raise exception 'Template exercise not found';
  end if;

  perform 1
  from public.workout_template_exercises
  where template_id = current_exercise.template_id
    and user_id = current_exercise.user_id
  order by position
  for update;

  select *
  into current_exercise
  from public.workout_template_exercises
  where id = p_exercise_id
    and user_id = (select auth.uid());

  if p_direction = 'up' then
    select *
    into adjacent_exercise
    from public.workout_template_exercises
    where template_id = current_exercise.template_id
      and user_id = current_exercise.user_id
      and position < current_exercise.position
    order by position desc
    limit 1
    for update;
  else
    select *
    into adjacent_exercise
    from public.workout_template_exercises
    where template_id = current_exercise.template_id
      and user_id = current_exercise.user_id
      and position > current_exercise.position
    order by position
    limit 1
    for update;
  end if;

  if not found then
    return false;
  end if;

  select coalesce(max(position), 0) + 1
  into temporary_position
  from public.workout_template_exercises
  where template_id = current_exercise.template_id;

  update public.workout_template_exercises
  set position = temporary_position
  where id = current_exercise.id;

  update public.workout_template_exercises
  set position = current_exercise.position
  where id = adjacent_exercise.id;

  update public.workout_template_exercises
  set position = adjacent_exercise.position
  where id = current_exercise.id;

  return true;
end;
$$;

revoke all on function public.move_workout_template_exercise(uuid, text)
  from public;
revoke all on function public.move_workout_template_exercise(uuid, text)
  from anon;

grant execute
  on function public.move_workout_template_exercise(uuid, text)
  to authenticated;
