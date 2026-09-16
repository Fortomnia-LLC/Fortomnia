-- Forward-port the compatibility guarantees from the superseded tombstone PR.
-- The mutation RPC must continue to see tombstones so stale writes cannot
-- recreate them, while ordinary authenticated table reads expose active rows.

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

-- RLS intentionally hides tombstones from ordinary clients. This RPC already
-- authenticates the caller, scopes every lookup/write to auth.uid(), and is the
-- only supported boundary that must see hidden rows for conflict resolution.
alter function public.apply_workout_set_mutation(
  text, uuid, uuid, text, bigint, timestamptz, jsonb
) security definer;

create or replace function public.cascade_workout_set_tombstone()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    update public.workout_sets
    set deleted_at = new.deleted_at,
        last_mutation_id = coalesce(last_mutation_id, new.last_mutation_id)
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

revoke all on function public.cascade_workout_set_tombstone() from public;

create or replace function public.soft_delete_workout_set()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Preserve physical deletion for FK cascades from workouts, accounts, and
  -- custom exercises. Direct deletes from older clients become tombstones.
  if pg_trigger_depth() > 1 then
    return old;
  end if;

  update public.workout_sets
  set deleted_at = coalesce(deleted_at, now()),
      last_mutation_id = coalesce(last_mutation_id, 'legacy-delete:' || id::text)
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

revoke all on function public.soft_delete_workout_set() from public;

alter table public.workout_sets
  drop constraint if exists workout_sets_exercise_id_fkey,
  add constraint workout_sets_exercise_id_fkey
    foreign key (exercise_id)
    references public.exercises (id)
    on delete cascade;

comment on function public.apply_workout_set_mutation(
  text, uuid, uuid, text, bigint, timestamptz, jsonb
) is
  'Authenticated ownership-scoped mutation boundary. SECURITY DEFINER is required only so conflict resolution can see RLS-hidden tombstones.';

