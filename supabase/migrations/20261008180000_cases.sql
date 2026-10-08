create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  segment text not null,
  summary text not null,
  logo_url text not null,
  cover_url text,
  concept text,
  location text,
  fronts text[] not null default '{}',
  video_url text,
  identities jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists cases_set_updated_at on public.cases;
create trigger cases_set_updated_at
before update on public.cases
for each row execute function public.set_updated_at();

alter table public.cases enable row level security;

drop policy if exists "cases_public_select_published" on public.cases;
create policy "cases_public_select_published" on public.cases
for select to anon, authenticated
using (published = true or (select auth.uid()) is not null);

drop policy if exists "cases_authenticated_insert" on public.cases;
create policy "cases_authenticated_insert" on public.cases
for insert to authenticated
with check ((select auth.uid()) is not null);

drop policy if exists "cases_authenticated_update" on public.cases;
create policy "cases_authenticated_update" on public.cases
for update to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

drop policy if exists "cases_authenticated_delete" on public.cases;
create policy "cases_authenticated_delete" on public.cases
for delete to authenticated
using ((select auth.uid()) is not null);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cases',
  'cases',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cases_public_read" on storage.objects;
create policy "cases_public_read" on storage.objects
for select to public
using (bucket_id = 'cases');

drop policy if exists "cases_authenticated_insert" on storage.objects;
create policy "cases_authenticated_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'cases' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "cases_authenticated_update" on storage.objects;
create policy "cases_authenticated_update" on storage.objects
for update to authenticated
using (bucket_id = 'cases' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'cases' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "cases_authenticated_delete" on storage.objects;
create policy "cases_authenticated_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'cases' and (storage.foldername(name))[1] = (select auth.uid())::text);
