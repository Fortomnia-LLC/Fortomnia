alter table public.supplement_protocols
  drop constraint supplement_protocols_frequency_check;

alter table public.supplement_protocols
  add constraint supplement_protocols_frequency_check
    check (
      frequency in (
        'daily',
        'weekly',
        'every_other_week',
        'selected_days',
        'as_needed'
      )
    );
