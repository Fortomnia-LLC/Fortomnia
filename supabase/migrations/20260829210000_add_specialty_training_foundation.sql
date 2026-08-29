-- Generalized specialty-training vocabulary for Fortomnia coaching.
-- Exercises remain reusable movements; events describe how performance is tested.

create table public.performance_qualities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9_]+$'),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.specialty_implements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9_]+$'),
  name text not null unique,
  sport text not null,
  implement_type text not null,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.exercise_performance_qualities (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  quality_id uuid not null references public.performance_qualities(id) on delete cascade,
  emphasis text not null default 'secondary' check (emphasis in ('primary', 'secondary')),
  primary key (exercise_id, quality_id)
);

create table public.exercise_implement_options (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  implement_id uuid not null references public.specialty_implements(id) on delete cascade,
  relationship text not null default 'preferred'
    check (relationship in ('required', 'preferred', 'substitute')),
  specificity smallint not null default 50 check (specificity between 0 and 100),
  notes text,
  primary key (exercise_id, implement_id)
);

create table public.competition_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9_]+$'),
  name text not null,
  sport text not null,
  objective text not null,
  measurement_primitives text[] not null default '{}',
  performance_intent text,
  time_cap_seconds integer check (time_cap_seconds is null or time_cap_seconds > 0),
  max_attempts integer check (max_attempts is null or max_attempts > 0),
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (measurement_primitives <@ array['weight','reps','time','distance','attempts','completion']::text[])
);

create table public.competition_event_implements (
  event_id uuid not null references public.competition_events(id) on delete cascade,
  implement_id uuid not null references public.specialty_implements(id) on delete cascade,
  relationship text not null default 'competition' check (relationship in ('competition', 'optional')),
  primary key (event_id, implement_id)
);

create table public.competition_event_qualities (
  event_id uuid not null references public.competition_events(id) on delete cascade,
  quality_id uuid not null references public.performance_qualities(id) on delete cascade,
  emphasis text not null default 'secondary' check (emphasis in ('primary', 'secondary')),
  primary key (event_id, quality_id)
);

create table public.competition_event_exercise_transfer (
  event_id uuid not null references public.competition_events(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  specificity smallint not null default 50 check (specificity between 0 and 100),
  notes text,
  primary key (event_id, exercise_id)
);

-- Fortomnia already stores time in duration_seconds and distance in metric_value/metric_unit.
-- Specialty work adds intent, attempt tracking, and success/failure without duplicating those metrics.
alter table public.workout_sets
  add column if not exists performance_intent text,
  add column if not exists attempt_number integer,
  add column if not exists successful boolean;

alter table public.workout_sets
  drop constraint if exists workout_sets_attempt_number_check,
  drop constraint if exists workout_sets_performance_intent_check;

alter table public.workout_sets
  add constraint workout_sets_attempt_number_check
    check (attempt_number is null or attempt_number > 0),
  add constraint workout_sets_performance_intent_check
    check (
      performance_intent is null or performance_intent in (
        'standard_sets', 'hold_for_time', 'timed_reps', 'max_lift',
        'carry_for_distance', 'series_for_time', 'carry_series_for_time', 'medley'
      )
    );

alter table public.performance_qualities enable row level security;
alter table public.specialty_implements enable row level security;
alter table public.exercise_performance_qualities enable row level security;
alter table public.exercise_implement_options enable row level security;
alter table public.competition_events enable row level security;
alter table public.competition_event_implements enable row level security;
alter table public.competition_event_qualities enable row level security;
alter table public.competition_event_exercise_transfer enable row level security;

grant select on public.performance_qualities, public.specialty_implements,
  public.exercise_performance_qualities, public.exercise_implement_options,
  public.competition_events, public.competition_event_implements,
  public.competition_event_qualities, public.competition_event_exercise_transfer
  to authenticated;

create policy "Authenticated users can view performance qualities" on public.performance_qualities for select to authenticated using (true);
create policy "Authenticated users can view specialty implements" on public.specialty_implements for select to authenticated using (true);
create policy "Authenticated users can view exercise qualities" on public.exercise_performance_qualities for select to authenticated using (true);
create policy "Authenticated users can view exercise implements" on public.exercise_implement_options for select to authenticated using (true);
create policy "Authenticated users can view competition events" on public.competition_events for select to authenticated using (true);
create policy "Authenticated users can view event implements" on public.competition_event_implements for select to authenticated using (true);
create policy "Authenticated users can view event qualities" on public.competition_event_qualities for select to authenticated using (true);
create policy "Authenticated users can view event exercise transfer" on public.competition_event_exercise_transfer for select to authenticated using (true);

insert into public.performance_qualities (slug, name, description) values
  ('max_strength', 'Max Strength', 'Highest force or load production.'),
  ('grip_endurance', 'Grip Endurance', 'Ability to sustain grip force over time.'),
  ('support_grip', 'Support Grip', 'Ability to support heavy loads in the hands.'),
  ('crush_strength', 'Crush Strength', 'Finger flexion strength against a closing implement.'),
  ('pinch_strength', 'Pinch Strength', 'Thumb-to-finger force on an open-hand implement.'),
  ('thumb_strength', 'Thumb Strength', 'Thumb-specific force production and stability.'),
  ('thick_bar_strength', 'Thick Handle Strength', 'Grip strength on large-diameter handles or bars.'),
  ('wrist_strength', 'Wrist Strength', 'Wrist flexion, extension, deviation, and stabilization strength.'),
  ('loaded_carry_capacity', 'Loaded Carry Capacity', 'Ability to move external load over distance.'),
  ('overhead_strength', 'Overhead Strength', 'Ability to stabilize and press load overhead.'),
  ('event_speed', 'Event Speed', 'Ability to complete event work rapidly under a time cap.'),
  ('medley_skill', 'Medley Skill', 'Ability to transition efficiently between multiple implements or tasks.');

insert into public.specialty_implements (slug, name, sport, implement_type, attributes) values
  ('hercules_hold_handles', 'Hercules Hold Handles', 'strongman', 'grip_handle', '{"paired":true}'::jsonb),
  ('strongman_log', 'Strongman Log', 'strongman', 'pressing_implement', '{}'::jsonb),
  ('conans_wheel', 'Conan''s Wheel', 'strongman', 'carry_implement', '{}'::jsonb),
  ('sandbag', 'Strongman Sandbag', 'strongman', 'loading_implement', '{}'::jsonb),
  ('kratos_mammoth_bar', 'Kratos/Mammoth Bar', 'strongman', 'deadlift_bar', '{}'::jsonb),
  ('thumb_blaster_2in', '2-inch Thumb Blaster', 'grip_sport', 'pinch_implement', '{"diameter_in":2}'::jsonb),
  ('nightmare_hercules_2in', '2-inch Nightmare Hercules Handles', 'grip_sport', 'grip_handle', '{"diameter_in":2,"paired":true}'::jsonb),
  ('thick_handled_heavy_hammer', 'Thick Handled Heavy Hammer', 'grip_sport', 'hammer', '{}'::jsonb),
  ('pinch_block', 'Pinch Block', 'grip_sport', 'pinch_implement', '{}'::jsonb),
  ('loading_pin', 'Loading Pin', 'multi_sport', 'loading_accessory', '{}'::jsonb),
  ('farmer_handles', 'Farmer Handles', 'strongman', 'carry_implement', '{"paired":true}'::jsonb);

insert into public.competition_events (slug, name, sport, objective, measurement_primitives, performance_intent, time_cap_seconds, max_attempts, rules) values
  ('grip_thumb_blaster_max', '2-inch Thumb Blaster Max Lift', 'grip_sport', 'max_weight', array['weight','attempts','completion'], 'max_lift', null, 4, '{"target_height_in":6}'::jsonb),
  ('grip_ten_challenge_medley', '10-Challenge Grip Medley', 'grip_sport', 'completion_then_time', array['time','completion'], 'medley', 60, 1, '{"challenge_count":10}'::jsonb),
  ('grip_heavy_hammer_ladder', 'Thick Handled Heavy Hammer Ladder', 'grip_sport', 'reps', array['weight','reps','time'], 'timed_reps', null, 1, '{}'::jsonb),
  ('grip_nightmare_hercules', '2-inch Nightmare Hercules Hold', 'grip_sport', 'max_time', array['weight','time'], 'hold_for_time', null, 1, '{}'::jsonb),
  ('strongman_max_deadlift', 'Max Deadlift (Kratos/Mammoth Bar)', 'strongman', 'max_weight', array['weight','attempts','completion'], 'max_lift', 60, 3, '{"hitching":true,"sumo":false,"miss_eliminates":true}'::jsonb),
  ('strongman_hercules_hold', 'Hercules Hold', 'strongman', 'max_time', array['weight','time'], 'hold_for_time', null, 1, '{"straps":false,"natural_grip_required":true}'::jsonb),
  ('strongman_max_log_press', 'Max Log Press', 'strongman', 'max_weight', array['weight','attempts','completion'], 'max_lift', 60, 3, '{"miss_eliminates":true,"down_command":true}'::jsonb),
  ('strongman_conans_wheel', 'Conan''s Wheel', 'strongman', 'max_distance', array['weight','distance','time'], 'carry_for_distance', 75, 1, '{"pickup_window_seconds":30,"mercy_zone_ft":5}'::jsonb),
  ('strongman_sandbag_series', 'Sandbag to Shoulder Series', 'strongman', 'completion_then_time', array['weight','reps','time','completion'], 'series_for_time', 75, 1, '{"sequential":true,"down_command":true}'::jsonb),
  ('strongman_stall_mat_stack', 'Stall Mat OCD Stack', 'strongman', 'min_time', array['distance','time','completion'], 'carry_series_for_time', null, 1, '{"mat_count":3,"course_ft":30,"stack_tolerance_in":1}'::jsonb);

insert into public.competition_event_implements (event_id, implement_id)
select e.id, i.id from public.competition_events e join public.specialty_implements i on
  (e.slug = 'grip_thumb_blaster_max' and i.slug = 'thumb_blaster_2in') or
  (e.slug = 'grip_heavy_hammer_ladder' and i.slug = 'thick_handled_heavy_hammer') or
  (e.slug = 'grip_nightmare_hercules' and i.slug = 'nightmare_hercules_2in') or
  (e.slug = 'strongman_max_deadlift' and i.slug = 'kratos_mammoth_bar') or
  (e.slug = 'strongman_hercules_hold' and i.slug = 'hercules_hold_handles') or
  (e.slug = 'strongman_max_log_press' and i.slug = 'strongman_log') or
  (e.slug = 'strongman_conans_wheel' and i.slug = 'conans_wheel') or
  (e.slug = 'strongman_sandbag_series' and i.slug = 'sandbag');

insert into public.competition_event_qualities (event_id, quality_id, emphasis)
select e.id, q.id, case when
  (e.slug in ('grip_nightmare_hercules','strongman_hercules_hold') and q.slug in ('grip_endurance','support_grip')) or
  (e.slug in ('grip_thumb_blaster_max') and q.slug in ('pinch_strength','thumb_strength')) or
  (e.slug in ('strongman_max_deadlift') and q.slug = 'max_strength') or
  (e.slug in ('strongman_max_log_press') and q.slug in ('max_strength','overhead_strength')) or
  (e.slug in ('strongman_conans_wheel') and q.slug = 'loaded_carry_capacity')
then 'primary' else 'secondary' end
from public.competition_events e cross join public.performance_qualities q
where
  (e.slug = 'grip_thumb_blaster_max' and q.slug in ('pinch_strength','thumb_strength','wrist_strength')) or
  (e.slug = 'grip_ten_challenge_medley' and q.slug in ('grip_endurance','event_speed','medley_skill')) or
  (e.slug = 'grip_heavy_hammer_ladder' and q.slug in ('thick_bar_strength','wrist_strength','grip_endurance')) or
  (e.slug = 'grip_nightmare_hercules' and q.slug in ('grip_endurance','support_grip','thick_bar_strength')) or
  (e.slug = 'strongman_max_deadlift' and q.slug in ('max_strength','support_grip')) or
  (e.slug = 'strongman_hercules_hold' and q.slug in ('grip_endurance','support_grip')) or
  (e.slug = 'strongman_max_log_press' and q.slug in ('max_strength','overhead_strength')) or
  (e.slug = 'strongman_conans_wheel' and q.slug in ('loaded_carry_capacity','grip_endurance')) or
  (e.slug = 'strongman_sandbag_series' and q.slug in ('event_speed','loaded_carry_capacity')) or
  (e.slug = 'strongman_stall_mat_stack' and q.slug in ('event_speed','loaded_carry_capacity'));
