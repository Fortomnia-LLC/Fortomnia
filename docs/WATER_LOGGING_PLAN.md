# Water Logging Plan

This document defines a release-safe first increment for water tracking. It is a design plan only; it does not add a production database migration.

## User experience

- Show today's water total and the user's daily goal on the Nutrition screen.
- Provide quick-add actions using the user's preferred unit, such as 8, 12, 16, and 24 fl oz or 250, 350, 500, and 750 mL.
- Allow a custom amount with a numerical keypad.
- Let users edit or delete an incorrect entry.
- Display progress without making medical hydration claims.
- Preserve the entered volume when switching between imperial and metric display units.

## Proposed data model

### nutrition_water_goals

- `user_id uuid primary key`
- `daily_goal_ml integer not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### water_entries

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null`
- `amount_ml integer not null check (amount_ml > 0)`
- `logged_at timestamptz not null default now()`
- `created_at timestamptz not null default now()`

Store canonical values in milliliters and convert only for display. Both tables require row-level security so users can access only their own records. Index `water_entries (user_id, logged_at desc)`.

## Delivery sequence

1. Add the migration, row-level-security policies, and generated database types.
2. Add pure conversion and daily-total helpers with unit tests.
3. Add the Nutrition-screen progress card and quick-add controls.
4. Add custom-entry, edit, and delete workflows.
5. Test date boundaries, time zones, imperial/metric conversion, offline errors, and large text sizes.

## Acceptance criteria

- A logged amount immediately updates today's total.
- Daily totals use the user's local calendar day.
- Imperial and metric displays round predictably without changing stored volume.
- Failed saves keep the user's amount visible and show a recoverable error.
- Deleting an entry reverses the displayed total.
- No default goal is presented as medical advice.
