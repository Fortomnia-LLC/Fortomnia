alter table public.exercises
  add column aliases text[] not null default '{}',
  add column secondary_muscles text[] not null default '{}',
  add column movement_pattern text not null default 'other'
    check (
      movement_pattern in (
        'squat',
        'hinge',
        'horizontal_push',
        'vertical_push',
        'horizontal_pull',
        'vertical_pull',
        'lunge',
        'carry',
        'rotation',
        'isolation',
        'conditioning',
        'mobility',
        'other'
      )
    ),
  add column instructions text,
  add column is_unilateral boolean not null default false;

create index exercises_muscle_group_idx
  on public.exercises (lower(muscle_group));

create index exercises_equipment_idx
  on public.exercises (lower(equipment))
  where equipment is not null;

create index exercises_movement_pattern_idx
  on public.exercises (movement_pattern);
