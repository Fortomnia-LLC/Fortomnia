alter table public.profiles
  add column if not exists coach_primary_focus text,
  add column if not exists coach_target_event_name text,
  add column if not exists coach_target_event_date date,
  add column if not exists coach_training_locations text[] not null default '{}'::text[],
  add column if not exists coach_training_location_details text,
  add column if not exists coach_weekly_training_days integer,
  add column if not exists coach_session_minutes integer,
  add column if not exists coach_sports text[] not null default '{}'::text[],
  add column if not exists coach_priority_metric_name text,
  add column if not exists coach_priority_metric_current numeric,
  add column if not exists coach_priority_metric_target numeric,
  add column if not exists coach_priority_metric_unit text,
  add column if not exists coach_nutrition_focus text,
  add column if not exists coach_cardio_focus text,
  add column if not exists coach_mobility_focus text,
  add column if not exists coach_preferred_cardio text[] not null default '{}'::text[];

alter table public.profiles
  drop constraint if exists profiles_coach_weekly_training_days_check,
  add constraint profiles_coach_weekly_training_days_check
    check (coach_weekly_training_days is null or coach_weekly_training_days between 1 and 7),
  drop constraint if exists profiles_coach_session_minutes_check,
  add constraint profiles_coach_session_minutes_check
    check (coach_session_minutes is null or coach_session_minutes between 15 and 300),
  drop constraint if exists profiles_coach_training_locations_check,
  add constraint profiles_coach_training_locations_check
    check (
      coach_training_locations <@ array[
        'commercial_gym',
        'home_gym',
        'garage_gym',
        'school_team_facility',
        'outdoors',
        'other'
      ]::text[]
    );
