create table public.user_specialty_equipment (
  user_id uuid not null references auth.users(id) on delete cascade,
  implement_id uuid not null references public.specialty_implements(id) on delete cascade,
  available boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, implement_id)
);

alter table public.user_specialty_equipment enable row level security;

revoke all on table public.user_specialty_equipment from anon;
revoke all on table public.user_specialty_equipment from authenticated;
grant select, insert, update, delete on table public.user_specialty_equipment to authenticated;

create policy "Users can view their specialty equipment"
  on public.user_specialty_equipment for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can add their specialty equipment"
  on public.user_specialty_equipment for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their specialty equipment"
  on public.user_specialty_equipment for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can remove their specialty equipment"
  on public.user_specialty_equipment for delete to authenticated
  using (user_id = (select auth.uid()));

create index user_specialty_equipment_user_idx
  on public.user_specialty_equipment(user_id, available);
