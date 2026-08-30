alter table public.nutrition_entries
  add column meal_number smallint
    check (meal_number between 1 and 8);
