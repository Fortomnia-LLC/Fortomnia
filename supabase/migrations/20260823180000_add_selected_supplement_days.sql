alter table public.supplement_protocols
  add column scheduled_days smallint[] not null default '{}';

alter table public.supplement_protocols
  drop constraint if exists supplement_protocols_frequency_check;

alter table public.supplement_protocols
  add constraint supplement_protocols_frequency_check
    check (frequency in ('daily', 'weekly', 'selected_days', 'as_needed')),
  add constraint supplement_protocols_scheduled_days_check
    check (
      scheduled_days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
      and (
        (frequency = 'selected_days' and cardinality(scheduled_days) > 0)
        or
        (frequency <> 'selected_days' and cardinality(scheduled_days) = 0)
      )
    );
