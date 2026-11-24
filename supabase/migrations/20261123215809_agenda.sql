-- Agenda: compromisso 1:1 com a tarefa dos Espaços.

create table public.task_appointments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null unique references public.space_tasks(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text not null default '' check (char_length(location) <= 200),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_appointments_range check (ends_at > starts_at)
);

create index task_appointments_starts_idx on public.task_appointments (starts_at);

create table public.task_appointment_attendees (
  appointment_id uuid not null references public.task_appointments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (appointment_id, user_id)
);

create index task_appointment_attendees_user_idx on public.task_appointment_attendees (user_id);

drop trigger if exists task_appointments_set_updated_at on public.task_appointments;
create trigger task_appointments_set_updated_at
before update on public.task_appointments
for each row execute function public.set_updated_at();

alter table public.space_task_events drop constraint if exists space_task_events_kind_check;
alter table public.space_task_events
  add constraint space_task_events_kind_check
  check (kind in ('created', 'advanced', 'approved', 'rejected', 'claimed', 'moved', 'comment', 'scheduled', 'rescheduled', 'unscheduled'));

create or replace function public.appointment_visible(p_appointment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.profile_is_admin()
    or public.profile_role() = 'coordinator'
    or exists (
      select 1 from public.task_appointment_attendees a
      where a.appointment_id = p_appointment_id and a.user_id = (select auth.uid())
    ),
    false
  );
$$;

revoke all on function public.appointment_visible(uuid) from public, anon;
grant execute on function public.appointment_visible(uuid) to authenticated;

alter table public.task_appointments enable row level security;
alter table public.task_appointment_attendees enable row level security;

create policy task_appointments_select on public.task_appointments
for select to authenticated using (public.appointment_visible(id));

create policy task_appointment_attendees_select on public.task_appointment_attendees
for select to authenticated using (public.appointment_visible(appointment_id));

grant select on public.task_appointments to authenticated;
grant select on public.task_appointment_attendees to authenticated;

drop policy if exists space_tasks_select on public.space_tasks;
create policy space_tasks_select on public.space_tasks
for select to authenticated using (
  public.space_task_visible(space_id, created_by, assignee_id)
  or exists (
    select 1 from public.task_appointments a
    where a.task_id = space_tasks.id and public.appointment_visible(a.id)
  )
);

create or replace function public.task_appointment_attendee_ids(p_appointment jsonb)
returns uuid[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
  v_id uuid;
  v_ok integer;
begin
  if jsonb_typeof(p_appointment->'attendeeIds') is distinct from 'array' then
    raise exception 'Escolha ao menos um participante.' using errcode = '22023';
  end if;
  select array_agg(distinct x::uuid) into v_ids
  from jsonb_array_elements_text(p_appointment->'attendeeIds') as t(x)
  where trim(x) <> '';
  if coalesce(array_length(v_ids, 1), 0) < 1 then
    raise exception 'Escolha ao menos um participante.' using errcode = '22023';
  end if;
  foreach v_id in array v_ids loop
    select 1 into v_ok
    from public.profiles p
    left join public.employee_records er on er.user_id = p.id
    where p.id = v_id
      and p.role in ('creator', 'coordinator', 'admin')
      and coalesce(er.employment_status, 'active') = 'active';
    if v_ok is null then
      raise exception 'Participante inválido.' using errcode = '22023';
    end if;
  end loop;
  return v_ids;
end;
$$;

create or replace function public.task_appointment_save(p_task_id uuid, p_appointment jsonb, p_kind text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_starts timestamptz;
  v_minutes integer;
  v_ends timestamptz;
  v_location text;
  v_ids uuid[];
  v_id uuid;
  v_appt public.task_appointments;
begin
  begin
    v_starts := (p_appointment->>'startsAt')::timestamptz;
  exception when others then
    v_starts := null;
  end;
  if v_starts is null then
    raise exception 'Informe a data e a hora de início.' using errcode = '22023';
  end if;
  v_minutes := coalesce((p_appointment->>'durationMinutes')::integer, 60);
  if v_minutes < 15 or v_minutes > 720 then
    raise exception 'A duração precisa ficar entre 15 e 720 minutos.' using errcode = '22023';
  end if;
  v_ends := v_starts + make_interval(mins => v_minutes);
  v_location := left(trim(coalesce(p_appointment->>'location', '')), 200);
  v_ids := public.task_appointment_attendee_ids(p_appointment);

  insert into public.task_appointments (task_id, starts_at, ends_at, location, created_by)
  values (p_task_id, v_starts, v_ends, v_location, auth.uid())
  on conflict (task_id) do update
    set starts_at = excluded.starts_at,
        ends_at = excluded.ends_at,
        location = excluded.location
  returning * into v_appt;

  delete from public.task_appointment_attendees where appointment_id = v_appt.id;
  foreach v_id in array v_ids loop
    insert into public.task_appointment_attendees (appointment_id, user_id) values (v_appt.id, v_id);
  end loop;

  insert into public.space_task_events (task_id, actor_id, kind, message)
  values (
    p_task_id,
    auth.uid(),
    p_kind,
    case p_kind
      when 'rescheduled' then 'Remarcou o compromisso'
      else 'Agendou compromisso'
    end
  );

  insert into public.notifications (user_id, task_id, message)
  select att.user_id, p_task_id,
    case p_kind
      when 'rescheduled' then 'Compromisso remarcado'
      else 'Novo compromisso'
    end
  from public.task_appointment_attendees att
  where att.appointment_id = v_appt.id and att.user_id is distinct from auth.uid();

  return v_appt.id;
end;
$$;

drop function if exists public.space_create_task(uuid, text, uuid, jsonb);

create or replace function public.space_create_task(p_form_id uuid, p_title text, p_client_id uuid, p_values jsonb, p_appointment jsonb default null)
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

  insert into public.space_tasks (space_id, form_id, stage_id, title, client_id, values, created_by)
  values (v_form.space_id, v_form.id, v_stage.id, trim(p_title), p_client_id, v_values, auth.uid())
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

create or replace function public.task_appointment_update(p_task_id uuid, p_appointment jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.space_tasks;
  v_old uuid[];
begin
  if auth.uid() is null then
    raise exception 'Não autenticado.' using errcode = '42501';
  end if;
  if not (public.profile_is_admin() or public.profile_role() = 'coordinator') then
    raise exception 'Sem permissão para remarcar.' using errcode = '42501';
  end if;
  v_task := public.space_lock_task(p_task_id);
  select array_agg(att.user_id) into v_old
  from public.task_appointments a
  join public.task_appointment_attendees att on att.appointment_id = a.id
  where a.task_id = p_task_id;
  perform public.task_appointment_save(p_task_id, p_appointment, 'rescheduled');
  insert into public.notifications (user_id, task_id, message)
  select uid, p_task_id, 'Compromisso remarcado'
  from unnest(coalesce(v_old, array[]::uuid[])) as uid
  where uid is distinct from auth.uid()
    and not exists (
      select 1 from public.task_appointments a
      join public.task_appointment_attendees att on att.appointment_id = a.id
      where a.task_id = p_task_id and att.user_id = uid
    );
end;
$$;

create or replace function public.task_appointment_delete(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.space_tasks;
  v_appt public.task_appointments;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado.' using errcode = '42501';
  end if;
  if not (public.profile_is_admin() or public.profile_role() = 'coordinator') then
    raise exception 'Sem permissão para remover o compromisso.' using errcode = '42501';
  end if;
  v_task := public.space_lock_task(p_task_id);
  select * into v_appt from public.task_appointments where task_id = p_task_id;
  if not found then
    raise exception 'Compromisso não encontrado.' using errcode = 'P0002';
  end if;
  insert into public.notifications (user_id, task_id, message)
  select att.user_id, p_task_id, 'Compromisso removido'
  from public.task_appointment_attendees att
  where att.appointment_id = v_appt.id and att.user_id is distinct from auth.uid();
  delete from public.task_appointments where id = v_appt.id;
  insert into public.space_task_events (task_id, actor_id, kind, message)
  values (p_task_id, auth.uid(), 'unscheduled', 'Removeu o compromisso');
end;
$$;

revoke all on function public.task_appointment_attendee_ids(jsonb) from public, anon, authenticated;
revoke all on function public.task_appointment_save(uuid, jsonb, text) from public, anon, authenticated;

do $$
declare
  f text;
begin
  foreach f in array array[
    'space_create_task(uuid, text, uuid, jsonb, jsonb)',
    'task_appointment_update(uuid, jsonb)',
    'task_appointment_delete(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;
