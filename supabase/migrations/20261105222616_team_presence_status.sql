create table if not exists public.team_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists team_statuses_set_updated_at on public.team_statuses;
create trigger team_statuses_set_updated_at
before update on public.team_statuses
for each row execute function public.set_updated_at();

alter table public.team_statuses enable row level security;

drop policy if exists "team_statuses_authenticated_select" on public.team_statuses;
create policy "team_statuses_authenticated_select" on public.team_statuses
for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "team_statuses_admin_insert" on public.team_statuses;
create policy "team_statuses_admin_insert" on public.team_statuses
for insert to authenticated
with check (public.profile_is_admin());

drop policy if exists "team_statuses_admin_update" on public.team_statuses;
create policy "team_statuses_admin_update" on public.team_statuses
for update to authenticated
using (public.profile_is_admin())
with check (public.profile_is_admin());

drop policy if exists "team_statuses_admin_delete" on public.team_statuses;
create policy "team_statuses_admin_delete" on public.team_statuses
for delete to authenticated
using (public.profile_is_admin());

alter table public.profiles
  add column if not exists available boolean not null default true,
  add column if not exists status_id uuid references public.team_statuses(id) on delete set null;

grant select, insert, update, delete on public.team_statuses to authenticated;
grant update (available, status_id) on public.profiles to authenticated;

insert into public.team_statuses (name, icon, sort_order)
values
  ('Modo foco', 'Focus', 0),
  ('Em reunião', 'Video', 1),
  ('Poucas demandas', 'ListChecks', 2)
on conflict (name) do nothing;
