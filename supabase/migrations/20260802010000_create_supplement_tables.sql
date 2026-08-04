create table public.supplement_protocols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  category text not null default 'other'
    check (
      category in (
        'vitamin',
        'mineral',
        'performance',
        'wellness',
        'prescription',
        'hormone',
        'peptide',
        'other'
      )
    ),
  dose_amount numeric(10, 3) not null default 0
    check (dose_amount between 0 and 1000000),
  dose_unit text not null
    check (char_length(trim(dose_unit)) > 0),
  route text not null default 'oral'
    check (
      route in (
        'oral',
        'injection',
        'topical',
        'sublingual',
        'inhaled',
        'other'
      )
    ),
  frequency text not null default 'daily'
    check (frequency in ('daily', 'weekly', 'as_needed')),
  scheduled_time time,
  start_date date not null default current_date,
  end_date date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (end_date is null or end_date >= start_date),
  unique (id, user_id)
);

create index supplement_protocols_user_active_idx
  on public.supplement_protocols (
    user_id,
    is_active,
    created_at desc
  );

create table public.supplement_logs (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null default current_date,
  status text not null
    check (status in ('taken', 'skipped')),
  completed_at timestamptz not null default now(),
  dose_amount numeric(10, 3) not null default 0
    check (dose_amount between 0 and 1000000),
  dose_unit text not null
    check (char_length(trim(dose_unit)) > 0),
  notes text,
  created_at timestamptz not null default now(),

  foreign key (protocol_id, user_id)
    references public.supplement_protocols (id, user_id)
    on delete cascade
);

create index supplement_logs_user_date_idx
  on public.supplement_logs (
    user_id,
    log_date desc,
    completed_at desc
  );

create index supplement_logs_protocol_date_idx
  on public.supplement_logs (
    protocol_id,
    log_date desc
  );

alter table public.supplement_protocols enable row level security;
alter table public.supplement_logs enable row level security;

revoke all on table public.supplement_protocols from anon;
revoke all on table public.supplement_protocols from authenticated;
grant select, insert, update, delete
  on table public.supplement_protocols to authenticated;

revoke all on table public.supplement_logs from anon;
revoke all on table public.supplement_logs from authenticated;
grant select, insert, update, delete
  on table public.supplement_logs to authenticated;

create policy "Users can view their own supplement protocols"
  on public.supplement_protocols
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own supplement protocols"
  on public.supplement_protocols
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own supplement protocols"
  on public.supplement_protocols
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own supplement protocols"
  on public.supplement_protocols
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can view their own supplement logs"
  on public.supplement_logs
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own supplement logs"
  on public.supplement_logs
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.supplement_protocols
      where supplement_protocols.id = protocol_id
        and supplement_protocols.user_id = (select auth.uid())
    )
  );

create policy "Users can update their own supplement logs"
  on public.supplement_logs
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.supplement_protocols
      where supplement_protocols.id = protocol_id
        and supplement_protocols.user_id = (select auth.uid())
    )
  );

create policy "Users can delete their own supplement logs"
  on public.supplement_logs
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
