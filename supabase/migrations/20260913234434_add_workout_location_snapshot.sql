-- Additive, nullable snapshot fields keep existing workout rows compatible.
alter table public.workout_sessions
  add column training_location_id uuid
    references public.training_locations(id) on delete set null,
  add column training_location_name text
    check (training_location_name is null or char_length(training_location_name) between 1 and 80),
  add column training_location_type text
    check (training_location_type is null or training_location_type in ('home', 'gym', 'hotel', 'outdoor', 'other')),
  add column training_location_equipment text[];

create index workout_sessions_training_location_idx
  on public.workout_sessions(training_location_id)
  where training_location_id is not null;

create function public.snapshot_active_training_location()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  select id, name, location_type, equipment
  into new.training_location_id,
       new.training_location_name,
       new.training_location_type,
       new.training_location_equipment
  from public.training_locations
  where user_id = new.user_id
    and is_active
  limit 1;

  return new;
end;
$$;

revoke all on function public.snapshot_active_training_location() from public;

create trigger workout_sessions_snapshot_training_location
before insert on public.workout_sessions
for each row execute function public.snapshot_active_training_location();

comment on column public.workout_sessions.training_location_name is
  'Creation-time display snapshot; retained if the saved location changes or is deleted.';
