create table if not exists public.demands (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  responsible_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('feedback', 'midia')),
  description text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists demands_kind_created_at_idx on public.demands (kind, created_at desc);
create index if not exists demands_client_id_idx on public.demands (client_id);

drop trigger if exists demands_set_updated_at on public.demands;
create trigger demands_set_updated_at
before update on public.demands
for each row execute function public.set_updated_at();

alter table public.demands enable row level security;

drop policy if exists "demands_authenticated_select" on public.demands;
create policy "demands_authenticated_select" on public.demands
for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "demands_authenticated_insert" on public.demands;
create policy "demands_authenticated_insert" on public.demands
for insert to authenticated
with check ((select auth.uid()) is not null);

drop policy if exists "demands_authenticated_update" on public.demands;
create policy "demands_authenticated_update" on public.demands
for update to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

drop policy if exists "demands_admin_delete" on public.demands;
create policy "demands_admin_delete" on public.demands
for delete to authenticated
using (public.profile_is_admin());
