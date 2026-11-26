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
  if auth.uid() is null then
    raise exception 'Não autenticado.' using errcode = '42501';
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
