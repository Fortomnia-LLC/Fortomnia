alter table public.exercises
  add column is_archived boolean not null default false;

create index exercises_owner_archived_idx
  on public.exercises (
    owner_id,
    is_archived,
    lower(name)
  )
  where owner_id is not null;
