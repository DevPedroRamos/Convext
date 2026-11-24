insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'space-files',
  'space-files',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "space_files_public_read" on storage.objects;
create policy "space_files_public_read" on storage.objects
for select to public
using (bucket_id = 'space-files');

drop policy if exists "space_files_authenticated_insert" on storage.objects;
create policy "space_files_authenticated_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'space-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "space_files_authenticated_update" on storage.objects;
create policy "space_files_authenticated_update" on storage.objects
for update to authenticated
using (bucket_id = 'space-files' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'space-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "space_files_authenticated_delete" on storage.objects;
create policy "space_files_authenticated_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'space-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

update public.space_forms
set fields = fields || '[{"key":"imagens","label":"Imagens","type":"gallery","required":false}]'::jsonb
where name = 'Cadastrar feedback'
  and not exists (
    select 1 from jsonb_array_elements(fields) as elem where elem->>'key' = 'imagens'
  );
