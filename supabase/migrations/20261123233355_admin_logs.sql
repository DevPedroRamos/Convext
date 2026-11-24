-- Ficha de admin editável por admin/service_role; registro de mutações da área administrativa.

create or replace function public.protect_admin_employee_record()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_id uuid;
begin
  target_id := case when tg_op = 'DELETE' then old.user_id else new.user_id end;
  if exists (select 1 from public.profiles where id = target_id and role = 'admin') then
    if auth.role() is distinct from 'service_role' and not public.profile_is_admin() then
      raise exception 'Admin employee records are read-only.' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create table public.platform_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  area text not null check (area in ('equipe', 'gestao', 'financeiro')),
  kind text not null check (kind in ('created', 'updated', 'deleted')),
  entity text not null,
  entity_id uuid,
  message text not null,
  created_at timestamptz not null default now()
);

create index platform_events_created_idx on public.platform_events (created_at desc);

alter table public.platform_events enable row level security;

create policy platform_events_admin_select on public.platform_events
for select to authenticated using (public.profile_is_admin());

grant select on public.platform_events to authenticated;

create or replace function public.log_platform_event(
  p_area text,
  p_kind text,
  p_entity text,
  p_entity_id uuid,
  p_message text,
  p_actor_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_actor uuid;
begin
  if auth.role() is distinct from 'service_role' and not public.profile_is_admin() then
    raise exception 'Sem permissão para registrar o evento.' using errcode = '42501';
  end if;
  v_actor := coalesce(p_actor_id, auth.uid());
  insert into public.platform_events (actor_id, area, kind, entity, entity_id, message)
  values (v_actor, p_area, p_kind, p_entity, p_entity_id, left(trim(p_message), 500))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.log_platform_event(text, text, text, uuid, text, uuid) from public, anon;
grant execute on function public.log_platform_event(text, text, text, uuid, text, uuid) to authenticated;

create or replace function public.platform_event_from_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
  v_area text;
  v_kind text;
  v_id uuid;
  v_label text;
  v_verb text;
begin
  v_row := to_jsonb(case when tg_op = 'DELETE' then old else new end);
  v_kind := case tg_op when 'INSERT' then 'created' when 'DELETE' then 'deleted' else 'updated' end;
  v_area := case
    when tg_table_name like 'finance_%' then 'financeiro'
    else 'gestao'
  end;
  v_verb := case v_kind when 'created' then 'Criou' when 'deleted' then 'Removeu' else 'Atualizou' end;
  begin
    v_id := nullif(v_row->>'id', '')::uuid;
  exception when others then
    v_id := null;
  end;
  v_label := coalesce(nullif(v_row->>'name', ''), nullif(v_row->>'label', ''), nullif(v_row->>'title', ''), nullif(v_row->>'description', ''), tg_table_name);
  perform public.log_platform_event(
    v_area,
    v_kind,
    tg_table_name,
    v_id,
    v_verb || ' ' || replace(tg_table_name, '_', ' ') || case when v_label is null or v_label = tg_table_name then '.' else ': “' || left(v_label, 80) || '”.' end,
    auth.uid()
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'spaces',
    'space_stages',
    'space_forms',
    'quick_actions',
    'team_statuses',
    'feedback_types',
    'finance_settings',
    'finance_expense_categories',
    'finance_expenses',
    'finance_payroll_runs'
  ] loop
    execute format('drop trigger if exists %I_platform_event on public.%I', t, t);
    execute format(
      'create trigger %I_platform_event after insert or update or delete on public.%I for each row execute function public.platform_event_from_row()',
      t, t
    );
  end loop;
end;
$$;
