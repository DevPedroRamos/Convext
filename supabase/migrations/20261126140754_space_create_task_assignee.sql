drop function if exists public.space_create_task(uuid, text, uuid, jsonb, jsonb);

create or replace function public.space_create_task(
  p_form_id uuid,
  p_title text,
  p_client_id uuid,
  p_values jsonb,
  p_appointment jsonb default null,
  p_assignee_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_form public.space_forms;
  v_stage public.space_stages;
  v_task public.space_tasks;
  v_field jsonb;
  v_values jsonb := coalesce(p_values, '{}'::jsonb);
  v_needs_appointment boolean := false;
  v_assignee uuid := null;
  v_role text;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado.' using errcode = '42501';
  end if;
  select * into v_form from public.space_forms where id = p_form_id and active;
  if not found then
    raise exception 'Formulário não encontrado.' using errcode = 'P0002';
  end if;
  if not (public.profile_is_admin() or public.profile_role() = any (v_form.audience_roles)) then
    raise exception 'Você não pode enviar este formulário.' using errcode = '42501';
  end if;
  if coalesce(length(trim(p_title)), 0) < 2 then
    raise exception 'Informe o título.' using errcode = '22023';
  end if;
  for v_field in select * from jsonb_array_elements(v_form.fields) loop
    if v_field->>'type' = 'appointment' then
      if coalesce((v_field->>'required')::boolean, false) then
        v_needs_appointment := true;
      end if;
      continue;
    end if;
    if v_field->>'type' = 'assignee' then
      if coalesce((v_field->>'required')::boolean, false) and p_assignee_id is null then
        raise exception 'Preencha: %.', v_field->>'label' using errcode = '22023';
      end if;
      if p_assignee_id is not null then
        select role::text into v_role from public.profiles where id = p_assignee_id;
        if not found then
          raise exception 'Responsável inválido.' using errcode = '22023';
        end if;
        if coalesce(nullif(trim(v_field->>'options'), ''), '') <> '' and v_role is distinct from trim(v_field->>'options') then
          raise exception 'O responsável precisa ser da role escolhida no formulário.' using errcode = '22023';
        end if;
        v_assignee := p_assignee_id;
      end if;
      continue;
    end if;
    if coalesce((v_field->>'required')::boolean, false) and v_field->>'key' not in ('titulo') then
      if v_field->>'type' = 'client' then
        if p_client_id is null then
          raise exception 'Preencha: %.', v_field->>'label' using errcode = '22023';
        end if;
      elsif coalesce(trim(v_values->>(v_field->>'key')), '') = '' then
        raise exception 'Preencha: %.', v_field->>'label' using errcode = '22023';
      end if;
    end if;
  end loop;
  if v_needs_appointment and p_appointment is null then
    raise exception 'Preencha o compromisso.' using errcode = '22023';
  end if;

  select * into v_stage from public.space_stages where space_id = v_form.space_id order by position, created_at limit 1;
  if not found then
    raise exception 'O espaço não tem etapas.' using errcode = 'P0001';
  end if;

  insert into public.space_tasks (space_id, form_id, stage_id, title, client_id, values, created_by, assignee_id)
  values (v_form.space_id, v_form.id, v_stage.id, trim(p_title), p_client_id, v_values, auth.uid(), v_assignee)
  returning * into v_task;

  insert into public.space_task_events (task_id, actor_id, kind, message)
  values (v_task.id, auth.uid(), 'created', 'Abriu pelo formulário ' || v_form.name);

  if p_appointment is not null then
    perform public.task_appointment_save(v_task.id, p_appointment, 'scheduled');
  end if;

  perform public.space_notify_stage(v_task, v_stage, 'Nova tarefa: “' || v_task.title || '” em ' || v_stage.name || '.');
  return v_task.id;
end;
$$;

revoke all on function public.space_create_task(uuid, text, uuid, jsonb, jsonb, uuid) from public, anon;
grant execute on function public.space_create_task(uuid, text, uuid, jsonb, jsonb, uuid) to authenticated;
