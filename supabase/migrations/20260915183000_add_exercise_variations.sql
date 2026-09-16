create table public.exercise_variants (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  grip text,
  attachment text,
  stance text,
  laterality text check (laterality in ('bilateral', 'unilateral', 'alternating')),
  execution_style text,
  aliases text[] not null default '{}',
  is_default boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (id, exercise_id),
  unique (exercise_id, name)
);

create unique index exercise_variants_one_default_idx
  on public.exercise_variants(exercise_id)
  where is_default;

create index exercise_variants_exercise_sort_idx
  on public.exercise_variants(exercise_id, sort_order, name);

alter table public.exercise_variants enable row level security;
revoke all on table public.exercise_variants from anon;
revoke all on table public.exercise_variants from authenticated;
grant select on table public.exercise_variants to authenticated;

create policy "Users can view variants for visible exercises"
  on public.exercise_variants
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.exercises
      where exercises.id = exercise_variants.exercise_id
        and (
          exercises.owner_id is null
          or exercises.owner_id = (select auth.uid())
        )
    )
  );

alter table public.workout_sets
  add column exercise_variant_id uuid;

alter table public.workout_sets
  add constraint workout_sets_variant_matches_exercise_fkey
  foreign key (exercise_variant_id, exercise_id)
  references public.exercise_variants(id, exercise_id);

create index workout_sets_exercise_variant_performed_idx
  on public.workout_sets(user_id, exercise_variant_id, performed_at desc)
  where exercise_variant_id is not null and deleted_at is null;

insert into public.exercise_variants (
  exercise_id, name, grip, attachment, stance, laterality,
  execution_style, aliases, is_default, sort_order
)
select
  exercises.id, variation.name, variation.grip, variation.attachment,
  variation.stance, variation.laterality, variation.execution_style,
  variation.aliases, variation.is_default, variation.sort_order
from public.exercises
cross join (
  values
    ('Wide Overhand Bar', 'overhand', 'straight bar', 'seated', 'bilateral', 'standard', array['wide grip pulldown'], true, 10),
    ('Medium Overhand Bar', 'overhand', 'straight bar', 'seated', 'bilateral', 'standard', array['medium grip pulldown'], false, 20),
    ('Narrow Neutral V-Bar', 'neutral', 'v-bar', 'seated', 'bilateral', 'standard', array['close grip pulldown','v bar pulldown'], false, 30),
    ('Narrow Underhand Bar', 'underhand', 'straight bar', 'seated', 'bilateral', 'standard', array['reverse grip pulldown'], false, 40),
    ('Neutral Independent Handles', 'neutral', 'independent handles', 'seated', 'bilateral', 'independent arms', array['dual handle pulldown'], false, 50),
    ('Single-Arm Seated Handle', 'neutral', 'single handle', 'seated', 'unilateral', 'single arm', array['one arm lat pulldown'], false, 60),
    ('Single-Arm Half-Kneeling Handle', 'neutral', 'single handle', 'half-kneeling', 'unilateral', 'single arm', array['half kneeling lat pulldown'], false, 70),
    ('Kneeling Rope Pulldown', 'neutral', 'rope', 'kneeling', 'bilateral', 'straight arm', array['rope lat pulldown'], false, 80)
) as variation(name, grip, attachment, stance, laterality, execution_style, aliases, is_default, sort_order)
where lower(exercises.name) = 'lat pulldown'
on conflict (exercise_id, name) do update set
  grip = excluded.grip,
  attachment = excluded.attachment,
  stance = excluded.stance,
  laterality = excluded.laterality,
  execution_style = excluded.execution_style,
  aliases = excluded.aliases,
  is_default = excluded.is_default,
  sort_order = excluded.sort_order;

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

  select * into current_row from public.workout_sets
  where id = p_entity_id and user_id = authenticated_user_id for update;

  if p_kind = 'delete_set' then
    if not found or current_row.deleted_at is not null then
      return jsonb_build_object('status', 'already_applied');
    end if;
    if current_row.last_mutation_id = p_mutation_id then
      return jsonb_build_object('status', 'already_applied', 'revision', current_row.sync_revision);
    end if;
    if current_row.session_id <> p_session_id or current_row.sync_revision <> p_expected_revision then
      return jsonb_build_object('status', 'conflict', 'revision', current_row.sync_revision);
    end if;
    update public.workout_sets set deleted_at = p_created_at, last_mutation_id = p_mutation_id
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
      exercise_variant_id = (p_set->>'exercise_variant_id')::uuid,
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

  if p_expected_revision <> 0 then return jsonb_build_object('status', 'conflict'); end if;

  insert into public.workout_sets (
    id, session_id, user_id, exercise_id, exercise_variant_id, set_number,
    reps, weight, weight_unit, reps_in_reserve, duration_seconds, intensity_rpe,
    metric_unit, metric_value, parent_set_id, performance_type, performed_at,
    set_type, set_variant, last_mutation_id
  ) values (
    p_entity_id, p_session_id, authenticated_user_id,
    (p_set->>'exercise_id')::uuid, (p_set->>'exercise_variant_id')::uuid,
    (p_set->>'set_number')::integer, (p_set->>'reps')::integer,
    (p_set->>'weight')::numeric, p_set->>'weight_unit',
    (p_set->>'reps_in_reserve')::integer, (p_set->>'duration_seconds')::integer,
    (p_set->>'intensity_rpe')::numeric, p_set->>'metric_unit',
    (p_set->>'metric_value')::numeric, (p_set->>'parent_set_id')::uuid,
    p_set->>'performance_type', p_created_at, p_set->>'set_type',
    p_set->>'set_variant', p_mutation_id
  );
  return jsonb_build_object('status', 'applied', 'revision', 1);
end;
$$;

revoke all on function public.apply_workout_set_mutation(text, uuid, uuid, text, bigint, timestamptz, jsonb) from public;
grant execute on function public.apply_workout_set_mutation(text, uuid, uuid, text, bigint, timestamptz, jsonb) to authenticated;
