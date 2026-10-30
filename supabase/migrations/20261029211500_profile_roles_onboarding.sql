alter table public.profiles
  add column if not exists cargo varchar,
  add column if not exists onboarding_completed boolean not null default false;

update public.profiles
set cargo = coalesce(nullif(trim(cargo), ''), role)
where cargo is null or trim(cargo) = '';

update public.profiles
set onboarding_completed = true;

update public.profiles
set
  role = 'admin',
  cargo = 'TECH LEAD',
  email = 'pedroramosnext@gmail.com',
  first_name = 'Pedro',
  last_name = 'Ramos',
  company = coalesce(company, 'Convext Mídias'),
  onboarding_completed = true
where id = '78c8d7bf-847c-46aa-8960-1182f2de13ab';

update public.profiles
set role = 'admin'
where role is null or role not in ('admin', 'traffic', 'coordinator', 'creator');

alter table public.profiles
  alter column role set default 'traffic';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role is null or role in ('admin', 'traffic', 'coordinator', 'creator'));

create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.role() = 'authenticated' then
    new.role := old.role;
    new.cargo := old.cargo;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_admin_fields on public.profiles;
create trigger profiles_protect_admin_fields
before update on public.profiles
for each row execute function public.protect_profile_admin_fields();

revoke execute on function public.protect_profile_admin_fields() from anon, authenticated, public;

create or replace function public.complete_profile_onboarding()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ready boolean;
begin
  update public.profiles
  set onboarding_completed = true
  where id = auth.uid()
    and coalesce(trim(first_name), '') <> ''
    and coalesce(trim(phone), '') <> ''
    and coalesce(trim(avatar_url), '') <> ''
    and onboarding_completed = false
  returning true into ready;

  return coalesce(ready, false);
end;
$$;

revoke all on function public.complete_profile_onboarding() from public, anon;
grant execute on function public.complete_profile_onboarding() to authenticated;

revoke update (role, cargo, onboarding_completed) on public.profiles from anon, authenticated;
