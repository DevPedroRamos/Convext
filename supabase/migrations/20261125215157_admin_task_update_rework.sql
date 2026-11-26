-- Admin edita a ficha da tarefa e solicita reajuste (mesmo em concluídas).

alter table public.space_task_events drop constraint if exists space_task_events_kind_check;
alter table public.space_task_events
  add constraint space_task_events_kind_check
  check (kind in (
    'created', 'advanced', 'approved', 'rejected', 'claimed', 'moved', 'comment',
    'scheduled', 'rescheduled', 'unscheduled', 'updated', 'reworked'
  ));

create or replace function public.space_task_update(
  p_task_id uuid,
  p_title text,
  p_client_id uuid,
  p_values jsonb,
  p_assignee_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.space_tasks;
  v_values jsonb := coalesce(p_values, '{}'::jsonb);
begin
  if not public.profile_is_admin() then
    raise exception 'Só o admin edita a demanda.' using errcode = '42501';
  end if;
  v_task := public.space_lock_task(p_task_id);
  if coalesce(length(trim(p_title)), 0) < 2 then
    raise exception 'Informe o título.' using errcode = '22023';
  end if;
  if jsonb_typeof(v_values) is distinct from 'object' then
    raise exception 'Valores inválidos.' using errcode = '22023';
  end if;
  if p_assignee_id is not null and not exists (select 1 from public.profiles where id = p_assignee_id) then
    raise exception 'Responsável inválido.' using errcode = '22023';
  end if;
  if p_client_id is not null and not exists (select 1 from public.clients where id = p_client_id) then
    raise exception 'Cliente inválido.' using errcode = '22023';
  end if;
  update public.space_tasks
  set title = trim(p_title),
      client_id = p_client_id,
      values = v_values,
      assignee_id = p_assignee_id
  where id = p_task_id;
  insert into public.space_task_events (task_id, actor_id, kind, message)
  values (p_task_id, auth.uid(), 'updated', 'Atualizou a demanda');
end;
$$;

create or replace function public.space_task_rework(p_task_id uuid, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.space_tasks;
  v_approval public.space_stages;
  v_done public.space_stages;
  v_back public.space_stages;
begin
  if not public.profile_is_admin() then
    raise exception 'Só o admin solicita reajuste.' using errcode = '42501';
  end if;
  v_task := public.space_lock_task(p_task_id);
  if coalesce(length(trim(p_reason)), 0) < 3 then
    raise exception 'Escreva o motivo do reajuste.' using errcode = '22023';
  end if;

  select * into v_approval
  from public.space_stages
  where space_id = v_task.space_id and type = 'approval'
  order by position desc, created_at desc
  limit 1;

  if found then
    select * into v_back from public.space_stages where id = v_approval.reject_to and space_id = v_approval.space_id;
    if not found then
      select * into v_back
      from public.space_stages
      where space_id = v_approval.space_id
        and (position, created_at) < (v_approval.position, v_approval.created_at)
      order by position desc, created_at desc
      limit 1;
    end if;
  else
    select * into v_done
    from public.space_stages
    where space_id = v_task.space_id and type = 'done'
    order by position desc, created_at desc
    limit 1;
    if found then
      select * into v_back
      from public.space_stages
      where space_id = v_done.space_id
        and (position, created_at) < (v_done.position, v_done.created_at)
      order by position desc, created_at desc
      limit 1;
    end if;
  end if;

  if v_back.id is null then
    raise exception 'Não há etapa para devolver.' using errcode = 'P0001';
  end if;

  perform public.space_enter_stage(
    p_task_id,
    v_back.id,
    'reworked',
    'Pediu reajuste (' || trim(p_reason) || ') e devolveu para ' || v_back.name
  );
  return v_back.id;
end;
$$;

revoke all on function public.space_task_update(uuid, text, uuid, jsonb, uuid) from public, anon;
grant execute on function public.space_task_update(uuid, text, uuid, jsonb, uuid) to authenticated;
revoke all on function public.space_task_rework(uuid, text) from public, anon;
grant execute on function public.space_task_rework(uuid, text) to authenticated;
