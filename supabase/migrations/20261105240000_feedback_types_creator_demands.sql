create table if not exists public.feedback_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  solution text not null default '',
  spawns_creator boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists feedback_types_set_updated_at on public.feedback_types;
create trigger feedback_types_set_updated_at
before update on public.feedback_types
for each row execute function public.set_updated_at();

alter table public.feedback_types enable row level security;

drop policy if exists "feedback_types_authenticated_select" on public.feedback_types;
create policy "feedback_types_authenticated_select" on public.feedback_types
for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "feedback_types_admin_insert" on public.feedback_types;
create policy "feedback_types_admin_insert" on public.feedback_types
for insert to authenticated
with check (public.profile_is_admin());

drop policy if exists "feedback_types_admin_update" on public.feedback_types;
create policy "feedback_types_admin_update" on public.feedback_types
for update to authenticated
using (public.profile_is_admin())
with check (public.profile_is_admin());

drop policy if exists "feedback_types_admin_delete" on public.feedback_types;
create policy "feedback_types_admin_delete" on public.feedback_types
for delete to authenticated
using (public.profile_is_admin());

grant select, insert, update, delete on public.feedback_types to authenticated;

insert into public.feedback_types (name, solution, spawns_creator, sort_order)
values
  ('Campanha nova', '', true, 0),
  ('ajuste', '', false, 1),
  ('DDD de fora', '', false, 2),
  ('ajuste de formulário', '', false, 3),
  ('renda baixa', '', false, 4),
  ('restrição', '', false, 5),
  ('falta de interação', '', false, 6),
  ('Fora da faixa etária', '', false, 7)
on conflict (name) do nothing;

alter table public.demands
  add column if not exists title text,
  add column if not exists briefing text,
  add column if not exists feedback_type_id uuid references public.feedback_types(id) on delete set null,
  add column if not exists solution text,
  add column if not exists source_demand_id uuid references public.demands(id) on delete set null,
  add column if not exists variation_note text;

alter table public.demands drop constraint if exists demands_kind_check;
alter table public.demands
  add constraint demands_kind_check check (kind in ('feedback', 'midia', 'creator'));

create index if not exists demands_source_demand_id_idx on public.demands (source_demand_id);
create index if not exists demands_feedback_type_id_idx on public.demands (feedback_type_id);

drop policy if exists "demands_authenticated_select" on public.demands;
create policy "demands_authenticated_select" on public.demands
for select to authenticated
using (
  public.profile_is_ops()
  or responsible_id = (select auth.uid())
  or created_by = (select auth.uid())
);

create table if not exists public.demand_files (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references public.demands(id) on delete cascade,
  kind text not null check (kind in ('reference', 'creative')),
  path text not null,
  name text not null,
  mime text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists demand_files_demand_id_idx on public.demand_files (demand_id, kind);

alter table public.demand_files enable row level security;

drop policy if exists "demand_files_select" on public.demand_files;
create policy "demand_files_select" on public.demand_files
for select to authenticated
using (
  exists (
    select 1 from public.demands d
    where d.id = demand_id
      and (
        public.profile_is_ops()
        or d.responsible_id = (select auth.uid())
        or d.created_by = (select auth.uid())
      )
  )
);

drop policy if exists "demand_files_insert" on public.demand_files;
create policy "demand_files_insert" on public.demand_files
for insert to authenticated
with check (
  exists (
    select 1 from public.demands d
    where d.id = demand_id
      and (
        public.profile_is_ops()
        or d.responsible_id = (select auth.uid())
        or d.created_by = (select auth.uid())
      )
  )
);

drop policy if exists "demand_files_delete" on public.demand_files;
create policy "demand_files_delete" on public.demand_files
for delete to authenticated
using (
  created_by = (select auth.uid())
  or public.profile_is_admin()
  or exists (
    select 1 from public.demands d
    where d.id = demand_id
      and d.responsible_id = (select auth.uid())
  )
);

grant select, insert, delete on public.demand_files to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'demand-files',
  'demand-files',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "demand_files_storage_select" on storage.objects;
create policy "demand_files_storage_select" on storage.objects
for select to authenticated
using (
  bucket_id = 'demand-files'
  and exists (
    select 1 from public.demands d
    where d.id::text = (storage.foldername(name))[1]
      and (
        public.profile_is_ops()
        or d.responsible_id = (select auth.uid())
        or d.created_by = (select auth.uid())
      )
  )
);

drop policy if exists "demand_files_storage_insert" on storage.objects;
create policy "demand_files_storage_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'demand-files'
  and exists (
    select 1 from public.demands d
    where d.id::text = (storage.foldername(name))[1]
      and (
        public.profile_is_ops()
        or d.responsible_id = (select auth.uid())
        or d.created_by = (select auth.uid())
      )
  )
);

drop policy if exists "demand_files_storage_delete" on storage.objects;
create policy "demand_files_storage_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'demand-files'
  and (
    public.profile_is_admin()
    or exists (
      select 1 from public.demands d
      where d.id::text = (storage.foldername(name))[1]
        and (
          d.responsible_id = (select auth.uid())
          or d.created_by = (select auth.uid())
        )
    )
  )
);
