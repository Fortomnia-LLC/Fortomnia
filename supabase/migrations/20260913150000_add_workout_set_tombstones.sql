alter table public.workout_sets
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

alter table public.workout_sets
  drop constraint if exists workout_sets_session_id_exercise_id_set_number_key;

create unique index if not exists workout_sets_active_session_exercise_number_idx
  on public.workout_sets (session_id, exercise_id, set_number)
  where deleted_at is null;

create index if not exists workout_sets_user_deleted_updated_idx
  on public.workout_sets (user_id, deleted_at, updated_at desc);

drop policy if exists "Users can view their own workout sets"
  on public.workout_sets;

create policy "Users can view their own active workout sets"
  on public.workout_sets
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and deleted_at is null
  );

alter table public.workout_sets
  drop constraint if exists workout_sets_exercise_id_fkey,
  add constraint workout_sets_exercise_id_fkey
    foreign key (exercise_id)
    references public.exercises (id)
    on delete cascade;

create or replace function public.cascade_workout_set_tombstone()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    update public.workout_sets
    set deleted_at = new.deleted_at,
        updated_at = greatest(updated_at, new.updated_at)
    where parent_set_id = new.id
      and session_id = new.session_id
      and user_id = new.user_id
      and deleted_at is null;
  end if;

  return new;
end;
$$;

drop trigger if exists workout_sets_cascade_tombstone
  on public.workout_sets;

create trigger workout_sets_cascade_tombstone
after update of deleted_at on public.workout_sets
for each row execute function public.cascade_workout_set_tombstone();

create or replace function public.soft_delete_workout_set()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  -- Preserve real cascades when a workout or account is deleted. Direct deletes
  -- from older app versions become tombstones during the compatibility window.
  if pg_trigger_depth() > 1 then
    return old;
  end if;

  update public.workout_sets
  set deleted_at = coalesce(deleted_at, now()),
      updated_at = now()
  where id = old.id
    and user_id = old.user_id;

  return null;
end;
$$;

drop trigger if exists workout_sets_soft_delete_compatibility
  on public.workout_sets;

create trigger workout_sets_soft_delete_compatibility
before delete on public.workout_sets
for each row execute function public.soft_delete_workout_set();

comment on column public.workout_sets.deleted_at is
  'Sync tombstone. Non-null rows are deleted from product views but retained to prevent stale offline clients from resurrecting them.';

comment on column public.workout_sets.updated_at is
  'Client mutation timestamp used to order and reconcile workout set changes.';
