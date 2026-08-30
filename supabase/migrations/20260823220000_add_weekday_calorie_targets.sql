alter table public.nutrition_goals
  add column weekday_calorie_targets integer[] not null default '{}'
    check (
      cardinality(weekday_calorie_targets) = 0
      or (
        cardinality(weekday_calorie_targets) = 7
        and weekday_calorie_targets[1] between 500 and 10000
        and weekday_calorie_targets[2] between 500 and 10000
        and weekday_calorie_targets[3] between 500 and 10000
        and weekday_calorie_targets[4] between 500 and 10000
        and weekday_calorie_targets[5] between 500 and 10000
        and weekday_calorie_targets[6] between 500 and 10000
        and weekday_calorie_targets[7] between 500 and 10000
      )
    );
