drop policy if exists "clients_authenticated_insert" on public.clients;
create policy "clients_ops_insert" on public.clients
for insert to authenticated
with check (public.profile_is_ops());

drop policy if exists "clients_authenticated_update" on public.clients;
create policy "clients_ops_update" on public.clients
for update to authenticated
using (public.profile_is_ops())
with check (public.profile_is_ops());

drop policy if exists "cases_authenticated_insert" on public.cases;
create policy "cases_ops_insert" on public.cases
for insert to authenticated
with check (public.profile_is_ops());

drop policy if exists "cases_authenticated_update" on public.cases;
create policy "cases_ops_update" on public.cases
for update to authenticated
using (public.profile_is_ops())
with check (public.profile_is_ops());

drop policy if exists "cases_authenticated_delete" on public.cases;
create policy "cases_ops_delete" on public.cases
for delete to authenticated
using (public.profile_is_ops());
