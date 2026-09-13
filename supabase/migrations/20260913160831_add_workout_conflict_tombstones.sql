-- Additive rollout: apply before shipping clients that call apply_workout_set_mutation.
-- Existing rows begin at revision 1 and remain visible because deleted_at is null.
-- migration-safety: destructive-reviewed
-- The legacy three-column uniqueness constraint is replaced by an equivalent
-- active-row-only index so a tombstoned set number can be reused. Forward-fix:
-- restore the constraint only after purging tombstones and resolving duplicates.

alter table public.workout_sessions
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists sync_revision bigint not null default 1;

alter table public.workout_sets
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists sync_revision bigint not null default 1,
  add column if not exists last_mutation_id text;

alter table public.workout_sessions
  add constraint workout_sessions_sync_revision_positive
  check (sync_revision > 0) not valid;

alter table public.workout_sessions
  validate constraint workout_sessions_sync_revision_positive;

alter table public.workout_sets
  add constraint workout_sets_sync_revision_positive
  check (sync_revision > 0) not valid;

alter table public.workout_sets
  validate constraint workout_sets_sync_revision_positive;

alter table public.workout_sets
  drop constraint if exists workout_sets_session_id_exercise_id_set_number_key;

create unique index workout_sets_active_session_exercise_number_idx
  on public.workout_sets (session_id, exercise_id, set_number)
  where deleted_at is null;

create index workout_sessions_user_updated_idx
  on public.workout_sessions (user_id, updated_at desc);

create index workout_sets_user_updated_idx
  on public.workout_sets (user_id, updated_at desc);

create index workout_sets_user_tombstones_idx
  on public.workout_sets (user_id, deleted_at)
  where deleted_at is not null;

create or replace function public.advance_workout_sync_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.deleted_at is not null and new.deleted_at is null then
    raise exception 'A workout tombstone cannot be restored by an ordinary update.'
      using errcode = '40001';
  end if;

  new.updated_at := now();
  new.sync_revision := old.sync_revision + 1;
  return new;
end;
$$;

create trigger workout_sessions_advance_sync_revision
before update on public.workout_sessions
for each row execute function public.advance_workout_sync_revision();

create trigger workout_sets_advance_sync_revision
before update on public.workout_sets
for each row execute function public.advance_workout_sync_revision();

revoke all on function public.advance_workout_sync_revision() from public;

create or replace function public.apply_workout_set_mutation(
  p_kind text,
  p_entity_id uuid,
  p_session_id uuid,
  p_mutation_id text,
  p_expected_revision bigint,
  p_created_at timestamptz,
  p_set jsonb default null
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  current_row public.workout_sets%rowtype;
  authenticated_user_id uuid := (select auth.uid());
begin
  if authenticated_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select * into current_row
  from public.workout_sets
  where id = p_entity_id and user_id = authenticated_user_id
  for update;

  if p_kind = 'delete_set' then
    if not found then
      return jsonb_build_object('status', 'already_applied');
    end if;
    if current_row.deleted_at is not null then
      return jsonb_build_object('status', 'already_applied', 'revision', current_row.sync_revision);
    end if;
    if current_row.last_mutation_id = p_mutation_id then
      return jsonb_build_object('status', 'already_applied', 'revision', current_row.sync_revision);
    end if;
    if current_row.session_id <> p_session_id or current_row.sync_revision <> p_expected_revision then
      return jsonb_build_object('status', 'conflict', 'revision', current_row.sync_revision);
    end if;

    update public.workout_sets
    set deleted_at = p_created_at, last_mutation_id = p_mutation_id
    where id = p_entity_id and user_id = authenticated_user_id;
    return jsonb_build_object('status', 'applied', 'revision', current_row.sync_revision + 1);
  end if;

  if p_kind <> 'upsert_set' or p_set is null then
    raise exception 'Unsupported workout set mutation.' using errcode = '22023';
  end if;

  if current_row.id is not null then
    if current_row.last_mutation_id = p_mutation_id then
      return jsonb_build_object('status', 'already_applied', 'revision', current_row.sync_revision);
    end if;
    if current_row.deleted_at is not null or current_row.sync_revision <> p_expected_revision then
      return jsonb_build_object('status', 'conflict', 'revision', current_row.sync_revision);
    end if;

    update public.workout_sets set
      exercise_id = (p_set->>'exercise_id')::uuid,
      set_number = (p_set->>'set_number')::integer,
      reps = (p_set->>'reps')::integer,
      weight = (p_set->>'weight')::numeric,
      weight_unit = p_set->>'weight_unit',
      reps_in_reserve = (p_set->>'reps_in_reserve')::integer,
      duration_seconds = (p_set->>'duration_seconds')::integer,
      intensity_rpe = (p_set->>'intensity_rpe')::numeric,
      metric_unit = p_set->>'metric_unit',
      metric_value = (p_set->>'metric_value')::numeric,
      parent_set_id = (p_set->>'parent_set_id')::uuid,
      performance_type = p_set->>'performance_type',
      performed_at = p_created_at,
      set_type = p_set->>'set_type',
      set_variant = p_set->>'set_variant',
      last_mutation_id = p_mutation_id
    where id = p_entity_id and user_id = authenticated_user_id;
    return jsonb_build_object('status', 'applied', 'revision', current_row.sync_revision + 1);
  end if;

  if p_expected_revision <> 0 then
    return jsonb_build_object('status', 'conflict');
  end if;

  insert into public.workout_sets (
    id, session_id, user_id, exercise_id, set_number, reps, weight,
    weight_unit, reps_in_reserve, duration_seconds, intensity_rpe, metric_unit,
    metric_value, parent_set_id, performance_type, performed_at, set_type,
    set_variant, last_mutation_id
  ) values (
    p_entity_id, p_session_id, authenticated_user_id,
    (p_set->>'exercise_id')::uuid, (p_set->>'set_number')::integer,
    (p_set->>'reps')::integer, (p_set->>'weight')::numeric,
    p_set->>'weight_unit', (p_set->>'reps_in_reserve')::integer,
    (p_set->>'duration_seconds')::integer, (p_set->>'intensity_rpe')::numeric,
    p_set->>'metric_unit', (p_set->>'metric_value')::numeric,
    (p_set->>'parent_set_id')::uuid, p_set->>'performance_type', p_created_at,
    p_set->>'set_type', p_set->>'set_variant', p_mutation_id
  );
  return jsonb_build_object('status', 'applied', 'revision', 1);
end;
$$;

revoke all on function public.apply_workout_set_mutation(text, uuid, uuid, text, bigint, timestamptz, jsonb) from public;
grant execute on function public.apply_workout_set_mutation(text, uuid, uuid, text, bigint, timestamptz, jsonb) to authenticated;

comment on function public.apply_workout_set_mutation(text, uuid, uuid, text, bigint, timestamptz, jsonb) is
  'Atomically applies an authenticated workout-set mutation using optimistic revisions. Tombstones win over stale writes.';
