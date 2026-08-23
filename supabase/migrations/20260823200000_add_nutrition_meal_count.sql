alter table public.nutrition_goals
  add column meal_count smallint not null default 3
    check (meal_count between 1 and 8);
