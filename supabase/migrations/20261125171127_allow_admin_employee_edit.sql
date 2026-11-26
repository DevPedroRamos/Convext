-- A API de equipe usa service_role. O trigger antigo bloqueava exatamente esse caminho.

create or replace function public.protect_managed_admin_profile()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.role = 'admin' then
    if auth.role() is distinct from 'service_role' and not public.profile_is_admin() then
      raise exception 'Admin profiles cannot be managed through the employee API.' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop policy if exists "employee_records_admin_select" on public.employee_records;
drop policy if exists "employee_records_admin_insert" on public.employee_records;
drop policy if exists "employee_records_admin_update" on public.employee_records;
drop policy if exists "employee_records_admin_delete" on public.employee_records;

create policy "employee_records_admin_select" on public.employee_records
for select to authenticated
using (public.profile_is_admin());

create policy "employee_records_admin_insert" on public.employee_records
for insert to authenticated
with check (public.profile_is_admin());

create policy "employee_records_admin_update" on public.employee_records
for update to authenticated
using (public.profile_is_admin())
with check (public.profile_is_admin());

create policy "employee_records_admin_delete" on public.employee_records
for delete to authenticated
using (public.profile_is_admin());
