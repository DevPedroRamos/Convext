create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  responsible_id uuid references public.profiles(id) on delete set null,
  company text not null,
  whatsapp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, company)
);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

create or replace function public.profile_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.profile_is_admin() from public, anon;
grant execute on function public.profile_is_admin() to authenticated;

drop policy if exists "clients_authenticated_select" on public.clients;
create policy "clients_authenticated_select" on public.clients
for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "clients_authenticated_insert" on public.clients;
create policy "clients_authenticated_insert" on public.clients
for insert to authenticated
with check ((select auth.uid()) is not null);

drop policy if exists "clients_authenticated_update" on public.clients;
create policy "clients_authenticated_update" on public.clients
for update to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

drop policy if exists "clients_admin_delete" on public.clients;
create policy "clients_admin_delete" on public.clients
for delete to authenticated
using (public.profile_is_admin());

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
for select to authenticated
using (true);

insert into public.clients (name, company, whatsapp, responsible_id)
select
  seed.name,
  seed.company,
  nullif(trim(seed.whatsapp), ''),
  (select p.id from public.profiles p where p.id = seed.responsible_id)
from (
  values
    ('ABUDE', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 99573-2155'),
    ('ADAJES', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 94007-6394'),
    ('ALBA', null, 'ECON VENDAS', null),
    ('ALVARO', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', null),
    ('AMADEU', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 96520-1209'),
    ('AMARÍLIS', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 96116-3915'),
    ('ARIEL', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 93742-9575'),
    ('ARRUDA', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 94546-8196'),
    ('ARTUR', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', null),
    ('BACANA', null, 'ECON VENDAS', null),
    ('BENAIA', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', null),
    ('BETOWAYNE', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 96918-8432'),
    ('BIANCA', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', null),
    ('BODALO', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', null),
    ('CABRINI', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', null),
    ('CAMILA', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 97483-4392'),
    ('CASTANHEIRA', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 99133-8584'),
    ('CHACON', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 96735-9006'),
    ('COMODORO', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 98203-0967'),
    ('CREMASCO', null, 'ECON VENDAS', null),
    ('CRIS SORATO', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 99796-3036'),
    ('DAILSON', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 99786-9189'),
    ('DAIMON', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', '11 96524-6556'),
    ('DANIPIRES', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', null),
    ('DIAS', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 99531-7552'),
    ('DUDU', null, 'ECON VENDAS', '11 98575-5438'),
    ('DURANT', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', null),
    ('ELDA', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', null),
    ('EMANUEL', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 99364-1986'),
    ('EMERICK', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 94066-5534'),
    ('EMIDI', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', null),
    ('ESFERA', '1502946b-1a3c-4fa4-b94f-bc0ba807216c'::uuid, 'ECON VENDAS', '11 99624-1475'),
    ('FABIO', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 93800-3953'),
    ('FAFA', null, 'ECON VENDAS', '11 91366-7568'),
    ('FAUZO', null, 'ECON VENDAS', '11 99137-5842'),
    ('FELIPE', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 96119-9632'),
    ('GAVA', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 99900-3353'),
    ('GIANCARLO', '1502946b-1a3c-4fa4-b94f-bc0ba807216c'::uuid, 'ECON VENDAS', '11 94996-3697'),
    ('GOUVEIA', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', '11 98283-5430'),
    ('GRILO', '1502946b-1a3c-4fa4-b94f-bc0ba807216c'::uuid, 'ECON VENDAS', '11 98173-7910'),
    ('GUGA', '1502946b-1a3c-4fa4-b94f-bc0ba807216c'::uuid, 'ECON VENDAS', '11 93221-6360'),
    ('GUIGA', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', null),
    ('HAZOR', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 94847-6277'),
    ('HERA', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', '11 93421-5271'),
    ('HUDSON', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 96128-0738'),
    ('INFLUENCER', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', null),
    ('JAGUAR', null, 'ECON VENDAS', '13 98225-3182'),
    ('JAQUEBRITO', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 98987-4022'),
    ('JARDIM', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 91098-4188'),
    ('JAYME', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', null),
    ('JIMMY', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 96243-5894'),
    ('JOANNA', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', null),
    ('JULLY', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', null),
    ('JUREMA', null, 'ECON VENDAS', null),
    ('KALEBE', '1502946b-1a3c-4fa4-b94f-bc0ba807216c'::uuid, 'ECON VENDAS', '11 96944-0011'),
    ('KANTOR', null, 'ECON VENDAS', null),
    ('KAROL', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 96835-8699'),
    ('KEVIN', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 97856-7282'),
    ('KIARA', '1502946b-1a3c-4fa4-b94f-bc0ba807216c'::uuid, 'ECON VENDAS', '11 91200-6642'),
    ('LEONE', '1502946b-1a3c-4fa4-b94f-bc0ba807216c'::uuid, 'ECON VENDAS', '11 99994-6180'),
    ('LESTE', '1502946b-1a3c-4fa4-b94f-bc0ba807216c'::uuid, 'ECON VENDAS', '11 94032-7357'),
    ('LETICIA', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', null),
    ('LEYLA', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 94747-4794'),
    ('LILIANE', null, 'ECON VENDAS', '11 98209-0149'),
    ('LUANA', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', '11 95693-9835'),
    ('LUCATELLI', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 98474-2419'),
    ('MACIEL', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 98411-1161'),
    ('MARGARETE', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 98796-6736'),
    ('MARGARIDA', null, 'ECON VENDAS', '11 99818-6476'),
    ('MARK', '1502946b-1a3c-4fa4-b94f-bc0ba807216c'::uuid, 'ECON VENDAS', null),
    ('MARQUES', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', null),
    ('MATTES', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 97609-0517'),
    ('MEL', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 99697-5025'),
    ('METLICZ', null, 'ECON VENDAS', null),
    ('MONALISA', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 97265-2647'),
    ('MOTA', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 99442-4267'),
    ('MOURA', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 98130-7214'),
    ('MUSTANG', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 95886-1613'),
    ('NAIRÓBI', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 97286-7059'),
    ('NETUNO', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', null),
    ('OAKLEY', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', null),
    ('PARANHOS', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', null),
    ('PAUL', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', '11 94876-9604'),
    ('PIVELLI', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', '11 99314-8807'),
    ('PORTUGAL', null, 'ECON VENDAS', null),
    ('RAFAELA', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', null),
    ('RAKKI', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', null),
    ('RAUL', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', null),
    ('RÉGIS', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', null),
    ('RENATO', '1502946b-1a3c-4fa4-b94f-bc0ba807216c'::uuid, 'ECON VENDAS', '11 95133-4373'),
    ('ROGER', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', '11 94713-6857'),
    ('ROSI CUNHA', '1502946b-1a3c-4fa4-b94f-bc0ba807216c'::uuid, 'ECON VENDAS', '11 99289-8019'),
    ('SAMUEL', null, 'ECON VENDAS', '11 99641-5224'),
    ('SANTORO', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 95117-0385'),
    ('SERAMIS', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', '11 98206-2507'),
    ('SIMONE', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', null),
    ('SNOW', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 98456-1344 / 11 99223-1186'),
    ('SOUZA', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 94729-6313'),
    ('SPINA', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', '13 99678-4791'),
    ('TALITA', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 98530-3648'),
    ('TAMI', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 95657-2852'),
    ('TIGUAN', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', null),
    ('TOM', null, 'ECON VENDAS', null),
    ('VASCONCELOS', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', '11 98526-4470'),
    ('VEIGGA', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 99569-8303'),
    ('VENERANDO', null, 'ECON VENDAS', null),
    ('VERZANI', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 93218-6631'),
    ('VICTTOR', '1502946b-1a3c-4fa4-b94f-bc0ba807216c'::uuid, 'ECON VENDAS', '11 98227-5353'),
    ('VINI', 'c6e7e214-cb64-4fb7-94bf-b10f269e073c'::uuid, 'ECON VENDAS', '11 94557-2155'),
    ('VIRGINIA', '1502946b-1a3c-4fa4-b94f-bc0ba807216c'::uuid, 'ECON VENDAS', '11 98428-6427'),
    ('VIRTUS', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 95721-4445'),
    ('WEDER', '05d86f9d-8e33-4e08-9b0e-89d4cf94060e'::uuid, 'ECON VENDAS', '11 93713-7319'),
    ('ZAMBOTTO', '1741d2b7-e61b-4426-b6ce-69893d5d7347'::uuid, 'ECON VENDAS', '11 95854-9713'),
    ('ZEUS', null, 'ECON VENDAS', '11 98470-4384')
) as seed(name, responsible_id, company, whatsapp)
on conflict (name, company) do nothing;
