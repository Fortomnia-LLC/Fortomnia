alter table public.supplement_protocols
  add column doses_per_day smallint not null default 1,
  add column second_scheduled_time time;

alter table public.supplement_protocols
  add constraint supplement_protocols_doses_per_day_check
    check (doses_per_day in (1, 2)),
  add constraint supplement_protocols_dose_times_check
    check (
      (
        doses_per_day = 1
        and second_scheduled_time is null
      )
      or
      (
        doses_per_day = 2
        and frequency <> 'as_needed'
        and scheduled_time is not null
        and second_scheduled_time is not null
        and scheduled_time < second_scheduled_time
      )
    );

alter table public.supplement_logs
  add column dose_slot text not null default 'single';

alter table public.supplement_logs
  add constraint supplement_logs_dose_slot_check
    check (dose_slot in ('single', 'morning', 'evening'));

create unique index supplement_logs_protocol_date_slot_idx
  on public.supplement_logs (
    protocol_id,
    log_date,
    dose_slot
  );
