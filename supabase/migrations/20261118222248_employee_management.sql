alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role is null or role in ('admin', 'traffic', 'coordinator', 'creator', 'commercial'));

create or replace function public.protect_managed_admin_profile()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.role = 'admin' and auth.role() = 'service_role' then
    raise exception 'Admin profiles cannot be managed through the employee API.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_managed_admin on public.profiles;
create trigger profiles_protect_managed_admin
before update or delete on public.profiles
for each row execute function public.protect_managed_admin_profile();

revoke all on function public.protect_managed_admin_profile() from public, anon, authenticated;

create table public.employee_records (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  hired_on date,
  employment_status text not null default 'active'
    check (employment_status in ('active', 'inactive')),
  contract_type text
    check (contract_type is null or contract_type in ('clt', 'pj', 'freelancer', 'partner_admin')),
  payment_model text
    check (payment_model is null or payment_model in ('fixed', 'commission', 'fixed_commission', 'custom')),
  fixed_amount_cents bigint
    check (fixed_amount_cents is null or fixed_amount_cents >= 0),
  commission_percent numeric(5, 2)
    check (commission_percent is null or commission_percent between 0 and 100),
  additional_amount_cents bigint
    check (additional_amount_cents is null or additional_amount_cents >= 0),
  payment_day smallint
    check (payment_day is null or payment_day between 1 and 31),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists employee_records_set_updated_at on public.employee_records;
create trigger employee_records_set_updated_at
before update on public.employee_records
for each row execute function public.set_updated_at();

insert into public.employee_records (user_id, employment_status)
select id, 'active'
from public.profiles
on conflict (user_id) do nothing;

create or replace function public.protect_admin_employee_record()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_id uuid;
begin
  target_id := case when tg_op = 'DELETE' then old.user_id else new.user_id end;
  if exists (
    select 1
    from public.profiles
    where id = target_id
      and role = 'admin'
  ) then
    raise exception 'Admin employee records are read-only.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists employee_records_protect_admin on public.employee_records;
create trigger employee_records_protect_admin
before insert or update or delete on public.employee_records
for each row execute function public.protect_admin_employee_record();

revoke all on function public.protect_admin_employee_record() from public, anon, authenticated;

alter table public.employee_records enable row level security;

create policy "employee_records_admin_select" on public.employee_records
for select to authenticated
using (
  public.profile_is_admin()
  and not exists (
    select 1 from public.profiles p
    where p.id = employee_records.user_id and p.role = 'admin'
  )
);

create policy "employee_records_admin_insert" on public.employee_records
for insert to authenticated
with check (
  public.profile_is_admin()
  and not exists (
    select 1 from public.profiles p
    where p.id = employee_records.user_id and p.role = 'admin'
  )
);

create policy "employee_records_admin_update" on public.employee_records
for update to authenticated
using (
  public.profile_is_admin()
  and not exists (
    select 1 from public.profiles p
    where p.id = employee_records.user_id and p.role = 'admin'
  )
)
with check (
  public.profile_is_admin()
  and not exists (
    select 1 from public.profiles p
    where p.id = employee_records.user_id and p.role = 'admin'
  )
);

create policy "employee_records_admin_delete" on public.employee_records
for delete to authenticated
using (
  public.profile_is_admin()
  and not exists (
    select 1 from public.profiles p
    where p.id = employee_records.user_id and p.role = 'admin'
  )
);

grant select, insert, update, delete on public.employee_records to authenticated;

create or replace function public.employee_access_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select
      p.role = 'admin'
      or er.employment_status = 'active'
    from public.profiles p
    left join public.employee_records er on er.user_id = p.id
    where p.id = (select auth.uid())
  ), false);
$$;

revoke all on function public.employee_access_is_active() from public, anon;
grant execute on function public.employee_access_is_active() to authenticated;

create or replace function communication.is_onboarded(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    left join public.employee_records er on er.user_id = p.id
    where p.id = user_id
      and p.onboarding_completed = true
      and p.role in ('admin', 'coordinator', 'traffic', 'creator', 'commercial')
      and (p.role = 'admin' or er.employment_status = 'active')
  );
$$;

create or replace function public.communication_list_people()
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
begin
  actor := communication.require_actor();
  return communication.ok(coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id,
      'firstName', p.first_name,
      'lastName', p.last_name,
      'avatarUrl', p.avatar_url,
      'available', coalesce(p.available, false),
      'inCall', exists (
        select 1 from public.communication_user_leases l where l.user_id = p.id and l.expires_at > now()
      )
    ) order by p.first_name)
    from public.profiles p
    left join public.employee_records er on er.user_id = p.id
    where p.onboarding_completed = true
      and p.id <> actor
      and p.role in ('admin', 'coordinator', 'traffic', 'creator', 'commercial')
      and (p.role = 'admin' or er.employment_status = 'active')
  ), '[]'::jsonb));
end;
$$;
