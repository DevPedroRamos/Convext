alter table public.demands
  add column if not exists priority text not null default 'medium',
  add column if not exists due_on date;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'demands_priority_check'
  ) then
    alter table public.demands
      add constraint demands_priority_check
      check (priority in ('low', 'medium', 'high'));
  end if;
end $$;

create or replace function public.profile_is_ops()
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
      and role in ('admin', 'coordinator')
  );
$$;

revoke all on function public.profile_is_ops() from public, anon;
grant execute on function public.profile_is_ops() to authenticated;

drop policy if exists "demands_authenticated_select" on public.demands;
create policy "demands_authenticated_select" on public.demands
for select to authenticated
using (
  public.profile_is_ops()
  or responsible_id = (select auth.uid())
);

drop policy if exists "demands_authenticated_update" on public.demands;
create policy "demands_authenticated_update" on public.demands
for update to authenticated
using (
  public.profile_is_ops()
  or responsible_id = (select auth.uid())
)
with check (
  public.profile_is_ops()
  or responsible_id = (select auth.uid())
);
