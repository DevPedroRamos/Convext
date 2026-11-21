-- Espaços: substitui Demandas e Feedback por espaços configuráveis.
-- Cada espaço tem um fluxo (etapas com dono por role, aprovação e informação exigida),
-- formulários que abrem tarefas e atalhos rápidos por role.
-- Tarefas só mudam por funções (security definer) que aplicam as regras do fluxo.
-- Decisão do produto: as demandas antigas são descartadas (plataforma em implantação).

-- ---------------------------------------------------------------------------
-- Remove Demandas e Feedback
-- ---------------------------------------------------------------------------
drop policy if exists "demand_files_storage_select" on storage.objects;
drop policy if exists "demand_files_storage_insert" on storage.objects;
drop policy if exists "demand_files_storage_delete" on storage.objects;
drop table if exists public.demand_files cascade;
drop table if exists public.demands cascade;
drop table if exists public.feedback_types cascade;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = (select auth.uid())), 'creator');
$$;

revoke all on function public.profile_role() from public, anon;
grant execute on function public.profile_role() to authenticated;

-- Roles válidas como dono de etapa e público de formulários/atalhos.
create or replace function public.space_valid_roles(roles text[])
returns boolean
language sql
immutable
as $$
  select coalesce(roles <@ array['admin', 'coordinator', 'traffic', 'creator', 'commercial']::text[], true);
$$;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------
create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) >= 2),
  color text not null default '#f35703' check (color ~ '^#[0-9a-fA-F]{6}$'),
  member_roles text[] not null default array['admin']::text[] check (public.space_valid_roles(member_roles)),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.space_stages (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  name text not null check (length(trim(name)) >= 1),
  position integer not null default 0,
  type text not null default 'normal' check (type in ('normal', 'approval', 'done')),
  owner_role text check (owner_role is null or owner_role in ('admin', 'coordinator', 'traffic', 'creator', 'commercial', 'requester')),
  requires_label text,
  notify boolean not null default true,
  reject_to uuid references public.space_stages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint space_stages_owner_check check (type = 'done' or owner_role is not null)
);

create index space_stages_space_idx on public.space_stages (space_id, position);

create table public.space_forms (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  name text not null check (length(trim(name)) >= 2),
  description text,
  audience_roles text[] not null default array['admin']::text[] check (public.space_valid_roles(audience_roles)),
  -- [{ key, label, type: text|longtext|number|date|select|client|link, required, options }]
  fields jsonb not null default '[]'::jsonb check (jsonb_typeof(fields) = 'array'),
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index space_forms_space_idx on public.space_forms (space_id, position);

create table public.space_tasks (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  form_id uuid references public.space_forms(id) on delete set null,
  stage_id uuid not null references public.space_stages(id) on delete restrict,
  title text not null check (length(trim(title)) >= 2),
  client_id uuid references public.clients(id) on delete set null,
  values jsonb not null default '{}'::jsonb check (jsonb_typeof(values) = 'object'),
  assignee_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index space_tasks_space_stage_idx on public.space_tasks (space_id, stage_id);
create index space_tasks_created_by_idx on public.space_tasks (created_by);
create index space_tasks_assignee_idx on public.space_tasks (assignee_id);
create index space_tasks_client_idx on public.space_tasks (client_id);

create table public.space_task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.space_tasks(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('created', 'advanced', 'approved', 'rejected', 'claimed', 'moved', 'comment')),
  message text not null,
  created_at timestamptz not null default now()
);

create index space_task_events_task_idx on public.space_task_events (task_id, created_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid references public.space_tasks(id) on delete cascade,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.quick_actions (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(trim(label)) >= 2),
  kind text not null check (kind in ('form', 'system')),
  form_id uuid references public.space_forms(id) on delete cascade,
  system_action text check (system_action is null or system_action in ('case', 'client', 'lead')),
  audience_roles text[] not null default array['admin']::text[] check (public.space_valid_roles(audience_roles)),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quick_actions_target_check check (
    (kind = 'form' and form_id is not null and system_action is null)
    or (kind = 'system' and system_action is not null and form_id is null)
  )
);

do $$
declare
  t text;
begin
  foreach t in array array['spaces', 'space_stages', 'space_forms', 'space_tasks', 'quick_actions'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.spaces enable row level security;
alter table public.space_stages enable row level security;
alter table public.space_forms enable row level security;
alter table public.space_tasks enable row level security;
alter table public.space_task_events enable row level security;
alter table public.notifications enable row level security;
alter table public.quick_actions enable row level security;

-- Configuração: todos leem (sidebar, formulários, atalhos); só admin escreve.
do $$
declare
  t text;
begin
  foreach t in array array['spaces', 'space_stages', 'space_forms', 'quick_actions'] loop
    execute format('create policy %I on public.%I for select to authenticated using (true)', t || '_select', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.profile_is_admin()) with check (public.profile_is_admin())', t || '_admin_write', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end;
$$;

-- Tarefas: admin, membros do espaço (pela role), quem abriu e o responsável veem.
-- Escrita só pelas funções abaixo; admin pode excluir.
create or replace function public.space_task_visible(p_space_id uuid, p_created_by uuid, p_assignee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- coalesce: comparações com NULL não podem virar "talvez" num IF NOT.
  select coalesce(
    public.profile_is_admin()
    or p_created_by = (select auth.uid())
    or p_assignee_id = (select auth.uid())
    or exists (select 1 from public.spaces s where s.id = p_space_id and public.profile_role() = any (s.member_roles)),
    false
  );
$$;

revoke all on function public.space_task_visible(uuid, uuid, uuid) from public, anon;
grant execute on function public.space_task_visible(uuid, uuid, uuid) to authenticated;

create policy space_tasks_select on public.space_tasks
for select to authenticated using (public.space_task_visible(space_id, created_by, assignee_id));
create policy space_tasks_admin_delete on public.space_tasks
for delete to authenticated using (public.profile_is_admin());
-- Admin reorganiza tarefas ao remover etapas do fluxo.
create policy space_tasks_admin_update on public.space_tasks
for update to authenticated using (public.profile_is_admin()) with check (public.profile_is_admin());
grant select, update, delete on public.space_tasks to authenticated;

create policy space_task_events_select on public.space_task_events
for select to authenticated using (exists (select 1 from public.space_tasks t where t.id = task_id));
grant select on public.space_task_events to authenticated;

create policy notifications_own_select on public.notifications
for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_own_update on public.notifications
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, update on public.notifications to authenticated;

-- ---------------------------------------------------------------------------
-- Regras do fluxo
-- ---------------------------------------------------------------------------

-- Avisa quem é dono da etapa (role ou quem abriu) ou, ao concluir, quem abriu.
create or replace function public.space_notify_stage(p_task public.space_tasks, p_stage public.space_stages, p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not p_stage.notify then
    return;
  end if;
  if p_stage.type = 'done' or p_stage.owner_role = 'requester' then
    if p_task.created_by is not null and p_task.created_by is distinct from auth.uid() then
      insert into public.notifications (user_id, task_id, message) values (p_task.created_by, p_task.id, p_message);
    end if;
    return;
  end if;
  insert into public.notifications (user_id, task_id, message)
  select p.id, p_task.id, p_message
  from public.profiles p
  left join public.employee_records er on er.user_id = p.id
  where p.role = p_stage.owner_role
    and p.id is distinct from auth.uid()
    and coalesce(er.employment_status, 'active') = 'active';
end;
$$;

create or replace function public.space_enter_stage(p_task_id uuid, p_stage_id uuid, p_kind text, p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.space_tasks;
  v_stage public.space_stages;
begin
  select * into v_stage from public.space_stages where id = p_stage_id;
  update public.space_tasks
  set stage_id = p_stage_id,
      assignee_id = null,
      completed_at = case when v_stage.type = 'done' then now() else null end
  where id = p_task_id
  returning * into v_task;

  insert into public.space_task_events (task_id, actor_id, kind, message) values (p_task_id, auth.uid(), p_kind, p_message);

  perform public.space_notify_stage(
    v_task,
    v_stage,
    case when v_stage.type = 'done' then '“' || v_task.title || '” foi concluída.'
         else 'Sua vez em “' || v_task.title || '”: ' || v_stage.name || '.' end
  );
end;
$$;

-- Pode agir na etapa atual: admin, quem abriu (dono "requester"), o responsável, ou a role dona sem responsável.
create or replace function public.space_can_act(p_task public.space_tasks, p_stage public.space_stages)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(p_stage.type <> 'done' and (
    public.profile_is_admin()
    or (p_stage.owner_role = 'requester' and p_task.created_by = auth.uid())
    or (p_stage.owner_role <> 'requester' and p_task.assignee_id = auth.uid())
    or (p_stage.owner_role <> 'requester' and p_task.assignee_id is null and public.profile_role() = p_stage.owner_role)
  ), false);
$$;

-- Trava e devolve a tarefa, se o usuário pode vê-la.
create or replace function public.space_lock_task(p_task_id uuid)
returns public.space_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.space_tasks;
begin
  select * into v_task from public.space_tasks where id = p_task_id for update;
  if not found or not public.space_task_visible(v_task.space_id, v_task.created_by, v_task.assignee_id) then
    raise exception 'Tarefa não encontrada.' using errcode = 'P0002';
  end if;
  return v_task;
end;
$$;

-- Abre uma tarefa por um formulário. Valida público e campos obrigatórios.
create or replace function public.space_create_task(p_form_id uuid, p_title text, p_client_id uuid, p_values jsonb)
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

  select * into v_stage from public.space_stages where space_id = v_form.space_id order by position, created_at limit 1;
  if not found then
    raise exception 'O espaço não tem etapas.' using errcode = 'P0001';
  end if;

  insert into public.space_tasks (space_id, form_id, stage_id, title, client_id, values, created_by)
  values (v_form.space_id, v_form.id, v_stage.id, trim(p_title), p_client_id, v_values, auth.uid())
  returning * into v_task;

  insert into public.space_task_events (task_id, actor_id, kind, message)
  values (v_task.id, auth.uid(), 'created', 'Abriu pelo formulário ' || v_form.name);

  perform public.space_notify_stage(v_task, v_stage, 'Nova tarefa: “' || v_task.title || '” em ' || v_stage.name || '.');
  return v_task.id;
end;
$$;

-- Conclui a etapa atual (não aprovação) e envia para a próxima.
create or replace function public.space_task_advance(p_task_id uuid, p_required_value text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.space_tasks;
  v_stage public.space_stages;
  v_next public.space_stages;
  v_message text;
begin
  v_task := public.space_lock_task(p_task_id);
  select * into v_stage from public.space_stages where id = v_task.stage_id;
  if not public.space_can_act(v_task, v_stage) then
    raise exception 'Esta etapa não é sua.' using errcode = '42501';
  end if;
  if v_stage.type = 'approval' then
    raise exception 'Use Aprovar ou Recusar.' using errcode = 'P0001';
  end if;

  if coalesce(trim(v_stage.requires_label), '') <> '' then
    if coalesce(trim(p_required_value), '') <> '' then
      update public.space_tasks set values = values || jsonb_build_object(v_stage.requires_label, trim(p_required_value)) where id = p_task_id;
    elsif coalesce(trim(v_task.values->>v_stage.requires_label), '') = '' then
      raise exception 'Informe: %.', v_stage.requires_label using errcode = '22023';
    end if;
  end if;

  select * into v_next from public.space_stages
  where space_id = v_stage.space_id and (position, created_at) > (v_stage.position, v_stage.created_at)
  order by position, created_at limit 1;
  if not found then
    raise exception 'Não há próxima etapa.' using errcode = 'P0001';
  end if;

  v_message := 'Concluiu ' || v_stage.name || ' e enviou para ' || v_next.name;
  perform public.space_enter_stage(p_task_id, v_next.id, 'advanced', v_message);
  return v_next.id;
end;
$$;

create or replace function public.space_task_approve(p_task_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.space_tasks;
  v_stage public.space_stages;
  v_next public.space_stages;
begin
  v_task := public.space_lock_task(p_task_id);
  select * into v_stage from public.space_stages where id = v_task.stage_id;
  if v_stage.type <> 'approval' then
    raise exception 'Esta etapa não é de aprovação.' using errcode = 'P0001';
  end if;
  if not public.space_can_act(v_task, v_stage) then
    raise exception 'Você não pode aprovar esta tarefa.' using errcode = '42501';
  end if;
  select * into v_next from public.space_stages
  where space_id = v_stage.space_id and (position, created_at) > (v_stage.position, v_stage.created_at)
  order by position, created_at limit 1;
  if not found then
    raise exception 'Não há próxima etapa.' using errcode = 'P0001';
  end if;
  perform public.space_enter_stage(p_task_id, v_next.id, 'approved', 'Aprovou e enviou para ' || v_next.name);
  return v_next.id;
end;
$$;

create or replace function public.space_task_reject(p_task_id uuid, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.space_tasks;
  v_stage public.space_stages;
  v_back public.space_stages;
begin
  v_task := public.space_lock_task(p_task_id);
  select * into v_stage from public.space_stages where id = v_task.stage_id;
  if v_stage.type <> 'approval' then
    raise exception 'Esta etapa não é de aprovação.' using errcode = 'P0001';
  end if;
  if not public.space_can_act(v_task, v_stage) then
    raise exception 'Você não pode recusar esta tarefa.' using errcode = '42501';
  end if;
  if coalesce(length(trim(p_reason)), 0) < 3 then
    raise exception 'Escreva o motivo da recusa.' using errcode = '22023';
  end if;
  select * into v_back from public.space_stages where id = v_stage.reject_to and space_id = v_stage.space_id;
  if not found then
    select * into v_back from public.space_stages
    where space_id = v_stage.space_id and (position, created_at) < (v_stage.position, v_stage.created_at)
    order by position desc, created_at desc limit 1;
  end if;
  if not found then
    raise exception 'Não há etapa para devolver.' using errcode = 'P0001';
  end if;
  perform public.space_enter_stage(p_task_id, v_back.id, 'rejected', 'Recusou (' || trim(p_reason) || ') e devolveu para ' || v_back.name);
  return v_back.id;
end;
$$;

create or replace function public.space_task_claim(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.space_tasks;
  v_stage public.space_stages;
begin
  v_task := public.space_lock_task(p_task_id);
  select * into v_stage from public.space_stages where id = v_task.stage_id;
  if v_stage.type = 'done' or v_stage.owner_role = 'requester' or v_task.assignee_id is not null
     or not (public.profile_role() = v_stage.owner_role or public.profile_is_admin()) then
    raise exception 'Você não pode pegar esta tarefa.' using errcode = '42501';
  end if;
  update public.space_tasks set assignee_id = auth.uid() where id = p_task_id;
  insert into public.space_task_events (task_id, actor_id, kind, message) values (p_task_id, auth.uid(), 'claimed', 'Pegou a tarefa');
end;
$$;

-- Admin move para qualquer etapa do espaço.
create or replace function public.space_task_move(p_task_id uuid, p_stage_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.space_tasks;
  v_stage public.space_stages;
  v_target public.space_stages;
begin
  if not public.profile_is_admin() then
    raise exception 'Só o admin move livremente.' using errcode = '42501';
  end if;
  v_task := public.space_lock_task(p_task_id);
  select * into v_stage from public.space_stages where id = v_task.stage_id;
  select * into v_target from public.space_stages where id = p_stage_id and space_id = v_task.space_id;
  if not found then
    raise exception 'Etapa inválida.' using errcode = '22023';
  end if;
  if v_target.id = v_task.stage_id then
    return;
  end if;
  perform public.space_enter_stage(p_task_id, v_target.id, 'moved', 'Moveu para ' || v_target.name);
end;
$$;

create or replace function public.space_task_comment(p_task_id uuid, p_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.space_tasks;
  v_stage public.space_stages;
begin
  v_task := public.space_lock_task(p_task_id);
  select * into v_stage from public.space_stages where id = v_task.stage_id;
  if coalesce(length(trim(p_message)), 0) < 1 then
    raise exception 'Escreva o comentário.' using errcode = '22023';
  end if;
  insert into public.space_task_events (task_id, actor_id, kind, message) values (p_task_id, auth.uid(), 'comment', trim(p_message));
end;
$$;

-- Funções internas não são chamáveis pelo cliente.
revoke all on function public.space_notify_stage(public.space_tasks, public.space_stages, text) from public, anon, authenticated;
revoke all on function public.space_enter_stage(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.space_can_act(public.space_tasks, public.space_stages) from public, anon, authenticated;
revoke all on function public.space_lock_task(uuid) from public, anon, authenticated;

do $$
declare
  f text;
begin
  foreach f in array array[
    'space_create_task(uuid, text, uuid, jsonb)',
    'space_task_advance(uuid, text)',
    'space_task_approve(uuid)',
    'space_task_reject(uuid, text)',
    'space_task_claim(uuid)',
    'space_task_move(uuid, uuid)',
    'space_task_comment(uuid, text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Espaços iniciais
-- ---------------------------------------------------------------------------
do $$
declare
  v_space uuid;
  v_back uuid;
  v_form uuid;
begin
  -- Campanhas: tarefa conjunta creator → tráfego → aprovação do admin.
  insert into public.spaces (name, color, member_roles, position)
  values ('Campanhas', '#f35703', array['admin', 'coordinator', 'traffic', 'creator', 'commercial'], 0) returning id into v_space;
  insert into public.space_stages (space_id, name, position, type, owner_role, requires_label) values (v_space, 'Solicitada', 0, 'normal', 'coordinator', null);
  insert into public.space_stages (space_id, name, position, type, owner_role, requires_label) values (v_space, 'Arte em criação', 1, 'normal', 'creator', 'Link da arte') returning id into v_back;
  insert into public.space_stages (space_id, name, position, type, owner_role, requires_label) values (v_space, 'Campanha em criação', 2, 'normal', 'traffic', 'Link da campanha');
  insert into public.space_stages (space_id, name, position, type, owner_role, reject_to) values (v_space, 'Aguardando aprovação', 3, 'approval', 'admin', v_back);
  insert into public.space_stages (space_id, name, position, type) values (v_space, 'Concluída', 4, 'done');
  insert into public.space_forms (space_id, name, description, audience_roles, fields) values (v_space, 'Pedir campanha nova',
    'Arte com o creator, campanha com o tráfego e aprovação do admin.', array['admin', 'coordinator', 'commercial'],
    '[{"key":"titulo","label":"Nome da campanha","type":"text","required":true},
      {"key":"cliente","label":"Cliente","type":"client","required":true},
      {"key":"objetivo","label":"Objetivo","type":"select","options":"Leads, Vendas, Alcance, Engajamento","required":true},
      {"key":"verba","label":"Verba mensal (R$)","type":"number","required":false},
      {"key":"briefing","label":"Briefing","type":"longtext","required":true}]'::jsonb)
  returning id into v_form;
  insert into public.quick_actions (label, kind, form_id, audience_roles, position) values ('Pedir campanha nova', 'form', v_form, array['admin', 'coordinator', 'commercial'], 2);

  -- Tráfego pago: execução pelo tráfego, aprovação do admin.
  insert into public.spaces (name, color, member_roles, position)
  values ('Tráfego pago', '#3987e5', array['admin', 'coordinator', 'traffic'], 1) returning id into v_space;
  insert into public.space_stages (space_id, name, position, type, owner_role) values (v_space, 'Solicitada', 0, 'normal', 'traffic');
  insert into public.space_stages (space_id, name, position, type, owner_role) values (v_space, 'Em execução', 1, 'normal', 'traffic') returning id into v_back;
  insert into public.space_stages (space_id, name, position, type, owner_role, requires_label) values (v_space, 'Campanha criada', 2, 'normal', 'traffic', 'Link da campanha');
  insert into public.space_stages (space_id, name, position, type, owner_role, reject_to) values (v_space, 'Aguardando aprovação', 3, 'approval', 'admin', v_back);
  insert into public.space_stages (space_id, name, position, type) values (v_space, 'Concluída', 4, 'done');
  insert into public.space_forms (space_id, name, description, audience_roles, fields) values (v_space, 'Solicitar ajuste de tráfego',
    'Pausar, escalar ou trocar público de uma campanha.', array['admin', 'coordinator', 'traffic'],
    '[{"key":"titulo","label":"O que precisa ser feito","type":"text","required":true},
      {"key":"cliente","label":"Cliente","type":"client","required":true},
      {"key":"prazo","label":"Prazo","type":"date","required":false}]'::jsonb);

  -- Feedback de clientes.
  insert into public.spaces (name, color, member_roles, position)
  values ('Feedback de clientes', '#199e70', array['admin', 'coordinator', 'traffic'], 2) returning id into v_space;
  insert into public.space_stages (space_id, name, position, type, owner_role) values (v_space, 'Novo', 0, 'normal', 'coordinator');
  insert into public.space_stages (space_id, name, position, type, owner_role, requires_label) values (v_space, 'Em tratamento', 1, 'normal', 'traffic', 'Resposta ao cliente');
  insert into public.space_stages (space_id, name, position, type) values (v_space, 'Concluído', 2, 'done');
  insert into public.space_forms (space_id, name, description, audience_roles, fields) values (v_space, 'Cadastrar feedback',
    'Reclamação, elogio ou pedido vindo do cliente.', array['admin', 'coordinator', 'traffic', 'commercial'],
    '[{"key":"titulo","label":"Resumo","type":"text","required":true},
      {"key":"cliente","label":"Cliente","type":"client","required":true},
      {"key":"tipo","label":"Tipo de feedback","type":"select","options":"Leads ruins, Custo alto, Criativo cansado, Elogio, Outro","required":true},
      {"key":"detalhe","label":"O que o cliente disse","type":"longtext","required":false}]'::jsonb)
  returning id into v_form;
  insert into public.quick_actions (label, kind, form_id, audience_roles, position) values ('Cadastrar feedback', 'form', v_form, array['admin', 'coordinator', 'traffic', 'commercial'], 3);

  -- Reports e bugs: qualquer um envia, só o admin vê o quadro.
  insert into public.spaces (name, color, member_roles, position)
  values ('Reports e bugs', '#9085e9', array['admin'], 3) returning id into v_space;
  insert into public.space_stages (space_id, name, position, type, owner_role) values (v_space, 'Recebido', 0, 'normal', 'admin');
  insert into public.space_stages (space_id, name, position, type, owner_role) values (v_space, 'Corrigindo', 1, 'normal', 'admin');
  insert into public.space_stages (space_id, name, position, type) values (v_space, 'Resolvido', 2, 'done');
  insert into public.space_forms (space_id, name, description, audience_roles, fields) values (v_space, 'Report de bug',
    'Algo não funciona na plataforma? Conte aqui.', array['admin', 'coordinator', 'traffic', 'creator', 'commercial'],
    '[{"key":"titulo","label":"O que aconteceu","type":"text","required":true},
      {"key":"tela","label":"Em qual tela","type":"select","options":"Espaços, Salas, Financeiro, Clientes, Outra","required":true},
      {"key":"passos","label":"Como reproduzir","type":"longtext","required":false}]'::jsonb)
  returning id into v_form;
  insert into public.quick_actions (label, kind, form_id, audience_roles, position) values ('Report de bug', 'form', v_form, array['admin', 'coordinator', 'traffic', 'creator', 'commercial'], 4);

  insert into public.quick_actions (label, kind, system_action, audience_roles, position) values
    ('Novo case', 'system', 'case', array['admin', 'coordinator'], 0),
    ('Novo cliente', 'system', 'client', array['admin', 'coordinator'], 1);
end;
$$;
