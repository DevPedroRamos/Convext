create schema if not exists communication;

revoke all on schema communication from public, anon, authenticated;
grant usage on schema communication to postgres, service_role;

create or replace function communication.ok(data jsonb default '{}'::jsonb)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object('ok', true, 'data', coalesce(data, '{}'::jsonb));
$$;

create or replace function communication.fail(code text, message text, retryable boolean default false)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object('ok', false, 'code', code, 'message', message, 'retryable', retryable);
$$;

create or replace function communication.actor_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function communication.is_onboarded(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and onboarding_completed = true
      and role in ('admin', 'coordinator', 'traffic', 'creator')
  );
$$;

create table if not exists public.communication_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 60),
  description text check (description is null or char_length(description) <= 240),
  access text not null check (access in ('open', 'private')),
  owner_id uuid not null references public.profiles(id),
  locked_at timestamptz,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.communication_room_members (
  room_id uuid not null references public.communication_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'moderator', 'member')),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create unique index if not exists communication_room_members_one_owner
  on public.communication_room_members (room_id)
  where role = 'owner';

create table if not exists public.communication_room_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.communication_rooms(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id),
  invitee_id uuid not null references public.profiles(id),
  state text not null check (state in ('pending', 'accepted', 'declined', 'expired', 'revoked')),
  expires_at timestamptz not null,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists communication_room_invites_one_pending
  on public.communication_room_invites (room_id, invitee_id)
  where state = 'pending';

create table if not exists public.communication_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.communication_rooms(id),
  kind text not null check (kind in ('room', 'direct')),
  initiator_id uuid not null references public.profiles(id),
  moderator_id uuid references public.profiles(id),
  provider_room_name text not null unique,
  state text not null check (state in ('waiting', 'active', 'ending', 'ended')),
  started_at timestamptz,
  ended_at timestamptz,
  empty_since timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  constraint communication_sessions_kind_room check (
    (kind = 'room' and room_id is not null) or (kind = 'direct' and room_id is null)
  )
);

create unique index if not exists communication_sessions_one_open_room
  on public.communication_sessions (room_id)
  where room_id is not null and state <> 'ended';

create table if not exists public.communication_call_invites (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.communication_sessions(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id),
  invitee_id uuid not null references public.profiles(id),
  state text not null check (state in ('ringing', 'accepted', 'declined', 'expired', 'cancelled')),
  expires_at timestamptz not null,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.communication_participations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.communication_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  connection_id text,
  generation integer not null default 1,
  state text not null check (state in ('reserved', 'joined', 'reconnecting', 'left', 'removed')),
  reserved_until timestamptz,
  joined_at timestamptz,
  left_at timestamptz,
  leave_reason text,
  created_at timestamptz not null default now()
);

create index if not exists communication_participations_session_idx
  on public.communication_participations (session_id, state);
create index if not exists communication_participations_user_idx
  on public.communication_participations (user_id, state);

create table if not exists public.communication_user_leases (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  participation_id uuid not null references public.communication_participations(id),
  generation integer not null,
  expires_at timestamptz not null
);

create table if not exists public.communication_media_leases (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.communication_sessions(id) on delete cascade,
  source text not null check (source in ('camera', 'screen')),
  slot integer not null,
  participation_id uuid not null references public.communication_participations(id),
  expires_at timestamptz,
  state text not null check (state in ('reserved', 'published', 'released')),
  created_at timestamptz not null default now()
);

create unique index if not exists communication_media_leases_active_slot
  on public.communication_media_leases (session_id, source, slot)
  where state in ('reserved', 'published');

create table if not exists public.communication_session_restrictions (
  session_id uuid not null references public.communication_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  removed boolean not null default false,
  deny_mic boolean not null default false,
  deny_camera boolean not null default false,
  deny_screen boolean not null default false,
  actor_id uuid references public.profiles(id),
  version integer not null default 1,
  primary key (session_id, user_id)
);

create table if not exists public.communication_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.communication_sessions(id) on delete set null,
  room_id uuid references public.communication_rooms(id) on delete set null,
  actor_id uuid references public.profiles(id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.communication_provider_events (
  event_id text primary key,
  type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  outcome text
);

create table if not exists public.communication_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  reference_id uuid,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists communication_notifications_recipient_idx
  on public.communication_notifications (recipient_id, created_at desc);

create table if not exists public.communication_outbox (
  id uuid primary key default gen_random_uuid(),
  operation_id text not null unique,
  operation text not null,
  target_id text not null,
  payload jsonb not null default '{}'::jsonb,
  state text not null default 'pending' check (state in ('pending', 'processing', 'done', 'failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now()
);

create table if not exists public.communication_idempotency (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  operation text not null,
  idempotency_key text not null,
  body_hash text not null,
  response jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, operation, idempotency_key)
);

create table if not exists communication.runtime_settings (
  key text primary key,
  value text not null
);

insert into communication.runtime_settings (key, value)
values
  ('max_participants', '12'),
  ('max_cameras', '6'),
  ('max_screens', '1'),
  ('ring_seconds', '30'),
  ('reserve_seconds', '30'),
  ('reconnect_seconds', '30'),
  ('empty_end_seconds', '60'),
  ('screen_reserve_seconds', '15'),
  ('room_invite_hours', '24')
on conflict (key) do nothing;

create or replace function communication.setting_int(name text, fallback integer)
returns integer
language sql
stable
as $$
  select coalesce((select value::integer from communication.runtime_settings where key = name), fallback);
$$;

create or replace function communication.notify(
  recipient uuid,
  kind text,
  reference uuid default null,
  payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.communication_notifications (recipient_id, kind, reference_id, payload)
  values (recipient, kind, reference, payload);
end;
$$;

create or replace function communication.audit(
  event_type text,
  session_id uuid default null,
  room_id uuid default null,
  actor_id uuid default null,
  payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.communication_events (session_id, room_id, actor_id, event_type, payload)
  values (session_id, room_id, actor_id, event_type, payload);
end;
$$;

create or replace function communication.enqueue(
  operation_id text,
  operation text,
  target_id text,
  payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.communication_outbox (operation_id, operation, target_id, payload)
  values (operation_id, operation, target_id, payload)
  on conflict (operation_id) do nothing;
end;
$$;

create or replace function communication.can_see_room(room public.communication_rooms, user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    room.archived_at is null
    and communication.is_onboarded(user_id)
    and (
      room.access = 'open'
      or exists (
        select 1 from public.communication_room_members m
        where m.room_id = room.id and m.user_id = user_id
      )
      or exists (
        select 1 from public.communication_room_invites i
        where i.room_id = room.id and i.invitee_id = user_id and i.state = 'pending' and i.expires_at > now()
      )
    );
$$;

create or replace function communication.room_role(room_id uuid, user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.communication_room_members m
  where m.room_id = room_id and m.user_id = user_id;
$$;

create or replace function communication.can_enter_room(room public.communication_rooms, user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    room.archived_at is null
    and communication.is_onboarded(user_id)
    and (
      (room.access = 'open' and communication.is_onboarded(user_id))
      or exists (
        select 1 from public.communication_room_members m
        where m.room_id = room.id and m.user_id = user_id
      )
    );
$$;

create or replace function communication.can_see_session(session public.communication_sessions, user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    communication.is_onboarded(user_id)
    and (
      session.initiator_id = user_id
      or session.moderator_id = user_id
      or exists (
        select 1 from public.communication_participations p
        where p.session_id = session.id and p.user_id = user_id
      )
      or exists (
        select 1 from public.communication_call_invites i
        where i.session_id = session.id and (i.invitee_id = user_id or i.inviter_id = user_id)
      )
      or (
        session.room_id is not null
        and exists (
          select 1 from public.communication_rooms r
          where r.id = session.room_id and communication.can_see_room(r, user_id)
        )
      )
    );
$$;

create or replace function communication.active_occupancy(session_id uuid)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from public.communication_participations p
  where p.session_id = session_id
    and (
      p.state in ('joined', 'reconnecting')
      or (p.state = 'reserved' and p.reserved_until > now())
    );
$$;

create or replace function communication.expire_pending()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invite record;
  session_row public.communication_sessions;
  occupied integer;
begin
  update public.communication_room_invites
  set state = 'expired', responded_at = coalesce(responded_at, now())
  where state = 'pending' and expires_at <= now();

  for invite in
    select * from public.communication_call_invites
    where state = 'ringing' and expires_at <= now()
  loop
    update public.communication_call_invites
    set state = 'expired', responded_at = now()
    where id = invite.id;

    select * into session_row from public.communication_sessions where id = invite.session_id;
    if session_row.state = 'waiting' then
      if not exists (
        select 1 from public.communication_call_invites
        where session_id = session_row.id and state in ('ringing', 'accepted')
      ) then
        update public.communication_sessions
        set state = 'ended', ended_at = now(), version = version + 1
        where id = session_row.id and state = 'waiting';
        perform communication.audit('call_unanswered', session_row.id, null, null, '{}'::jsonb);
      end if;
    end if;
  end loop;

  update public.communication_participations
  set state = 'left', left_at = now(), leave_reason = 'reservation_expired'
  where state = 'reserved' and reserved_until <= now();

  update public.communication_media_leases
  set state = 'released'
  where state = 'reserved' and expires_at is not null and expires_at <= now();

  for session_row in
    select * from public.communication_sessions
    where state in ('waiting', 'active')
  loop
    occupied := communication.active_occupancy(session_row.id);
    if occupied = 0 then
      if session_row.empty_since is null then
        update public.communication_sessions set empty_since = now() where id = session_row.id;
      elsif session_row.empty_since <= now() - make_interval(secs => communication.setting_int('empty_end_seconds', 60)) then
        update public.communication_sessions
        set state = 'ended', ended_at = now(), version = version + 1, empty_since = empty_since
        where id = session_row.id and state <> 'ended';
        perform communication.enqueue(
          'end:' || session_row.id::text,
          'end_provider_room',
          session_row.provider_room_name,
          jsonb_build_object('sessionId', session_row.id)
        );
      end if;
    else
      update public.communication_sessions set empty_since = null where id = session_row.id and empty_since is not null;
    end if;
  end loop;

  delete from public.communication_user_leases where expires_at <= now();
  delete from public.communication_provider_events where received_at <= now() - interval '7 days';
  delete from public.communication_events where created_at <= now() - interval '30 days';
end;
$$;

create or replace function communication.require_actor()
returns uuid
language plpgsql
stable
as $$
declare
  actor uuid;
begin
  actor := communication.actor_id();
  if actor is null or not communication.is_onboarded(actor) then
    raise exception using message = communication.fail('AUTH_REQUIRED', 'Autenticação necessária.')::text;
  end if;
  return actor;
end;
$$;

create or replace function public.communication_begin_idempotency(
  p_operation text,
  p_key text,
  p_body_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  existing public.communication_idempotency;
begin
  actor := communication.require_actor();
  select * into existing
  from public.communication_idempotency
  where user_id = actor and operation = p_operation and idempotency_key = p_key;

  if found then
    if existing.body_hash <> p_body_hash then
      return communication.fail('VERSION_CONFLICT', 'Idempotency-Key reutilizada com outro corpo.', false);
    end if;
    if existing.response is not null then
      return communication.ok(jsonb_build_object('replay', true, 'response', existing.response));
    end if;
    return communication.ok(jsonb_build_object('replay', false, 'id', existing.id));
  end if;

  insert into public.communication_idempotency (user_id, operation, idempotency_key, body_hash)
  values (actor, p_operation, p_key, p_body_hash)
  returning * into existing;

  return communication.ok(jsonb_build_object('replay', false, 'id', existing.id));
end;
$$;

create or replace function public.communication_complete_idempotency(p_id uuid, p_response jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
begin
  actor := communication.require_actor();
  update public.communication_idempotency
  set response = p_response
  where id = p_id and user_id = actor;
  return communication.ok();
end;
$$;

create or replace function public.communication_create_room(
  p_name text,
  p_description text,
  p_access text,
  p_invitee_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  room public.communication_rooms;
  invitee uuid;
begin
  actor := communication.require_actor();
  if p_access not in ('open', 'private') then
    return communication.fail('ACTION_DENIED', 'Acesso inválido.');
  end if;

  insert into public.communication_rooms (name, description, access, owner_id)
  values (trim(p_name), nullif(trim(coalesce(p_description, '')), ''), p_access, actor)
  returning * into room;

  insert into public.communication_room_members (room_id, user_id, role)
  values (room.id, actor, 'owner');

  if p_access = 'private' then
    foreach invitee in array coalesce(p_invitee_ids, array[]::uuid[])
    loop
      if invitee = actor or not communication.is_onboarded(invitee) then
        continue;
      end if;
      insert into public.communication_room_invites (room_id, inviter_id, invitee_id, state, expires_at)
      values (room.id, actor, invitee, 'pending', now() + make_interval(hours => communication.setting_int('room_invite_hours', 24)));
      perform communication.notify(invitee, 'room_invite', room.id, jsonb_build_object('roomId', room.id, 'name', room.name));
    end loop;
  end if;

  perform communication.audit('room_created', null, room.id, actor, jsonb_build_object('access', p_access));
  return communication.ok(to_jsonb(room));
end;
$$;

create or replace function public.communication_update_room(
  p_room_id uuid,
  p_expected_version integer,
  p_name text,
  p_description text,
  p_access text,
  p_locked boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  room public.communication_rooms;
  role text;
  occupied integer;
begin
  actor := communication.require_actor();
  select * into room from public.communication_rooms where id = p_room_id;
  if not found or not communication.can_see_room(room, actor) then
    return communication.fail('ROOM_UNAVAILABLE', 'Sala indisponível.');
  end if;
  if room.archived_at is not null then
    return communication.fail('ACTION_DENIED', 'Sala arquivada.');
  end if;
  if room.version <> p_expected_version then
    return communication.fail('VERSION_CONFLICT', 'A sala foi alterada por outra pessoa.');
  end if;
  role := communication.room_role(room.id, actor);
  if role is distinct from 'owner' then
    return communication.fail('ACTION_DENIED', 'Somente o proprietário altera a sala.');
  end if;
  if p_access = 'private' and room.access = 'open' then
    select communication.active_occupancy(s.id) into occupied
    from public.communication_sessions s
    where s.room_id = room.id and s.state <> 'ended'
    limit 1;
    if coalesce(occupied, 0) > 0 then
      return communication.fail('ACTION_DENIED', 'Esvazie a sessão antes de tornar a sala privada.');
    end if;
  end if;

  update public.communication_rooms
  set
    name = coalesce(nullif(trim(p_name), ''), name),
    description = case when p_description is null then description else nullif(trim(p_description), '') end,
    access = coalesce(p_access, access),
    locked_at = case when p_locked is null then locked_at when p_locked then coalesce(locked_at, now()) else null end,
    version = version + 1
  where id = room.id
  returning * into room;

  return communication.ok(to_jsonb(room));
end;
$$;

create or replace function public.communication_archive_room(p_room_id uuid, p_expected_version integer)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  room public.communication_rooms;
  session_row public.communication_sessions;
  is_admin boolean;
begin
  actor := communication.require_actor();
  select * into room from public.communication_rooms where id = p_room_id;
  if not found then
    return communication.fail('ROOM_UNAVAILABLE', 'Sala indisponível.');
  end if;
  select exists (select 1 from public.profiles where id = actor and role = 'admin') into is_admin;
  if communication.room_role(room.id, actor) is distinct from 'owner' and not is_admin then
    return communication.fail('ACTION_DENIED', 'Sem permissão para arquivar.');
  end if;
  if not is_admin and not communication.can_see_room(room, actor) then
    return communication.fail('ROOM_UNAVAILABLE', 'Sala indisponível.');
  end if;
  if room.version <> p_expected_version then
    return communication.fail('VERSION_CONFLICT', 'A sala foi alterada por outra pessoa.');
  end if;

  for session_row in
    select * from public.communication_sessions where room_id = room.id and state <> 'ended'
  loop
    update public.communication_sessions
    set state = 'ended', ended_at = now(), version = version + 1
    where id = session_row.id;
    update public.communication_participations
    set state = 'removed', left_at = now(), leave_reason = 'room_archived'
    where session_id = session_row.id and state in ('reserved', 'joined', 'reconnecting');
    perform communication.enqueue(
      'end:' || session_row.id::text,
      'end_provider_room',
      session_row.provider_room_name,
      jsonb_build_object('sessionId', session_row.id)
    );
  end loop;

  update public.communication_rooms
  set archived_at = now(), version = version + 1
  where id = room.id
  returning * into room;

  perform communication.audit('room_archived', null, room.id, actor, '{}'::jsonb);
  return communication.ok(to_jsonb(room));
end;
$$;

create or replace function public.communication_invite_to_room(p_room_id uuid, p_invitee_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  room public.communication_rooms;
  role text;
  invitee uuid;
  created uuid[] := array[]::uuid[];
begin
  actor := communication.require_actor();
  select * into room from public.communication_rooms where id = p_room_id;
  if not found or not communication.can_see_room(room, actor) then
    return communication.fail('ROOM_UNAVAILABLE', 'Sala indisponível.');
  end if;
  role := communication.room_role(room.id, actor);
  if role not in ('owner', 'moderator') or room.access <> 'private' then
    return communication.fail('ACTION_DENIED', 'Sem permissão para convidar.');
  end if;

  foreach invitee in array coalesce(p_invitee_ids, array[]::uuid[])
  loop
    if invitee = actor or not communication.is_onboarded(invitee) then
      continue;
    end if;
    if exists (select 1 from public.communication_room_members where room_id = room.id and user_id = invitee) then
      continue;
    end if;
    insert into public.communication_room_invites (room_id, inviter_id, invitee_id, state, expires_at)
    values (room.id, actor, invitee, 'pending', now() + make_interval(hours => communication.setting_int('room_invite_hours', 24)))
    on conflict do nothing;
    created := array_append(created, invitee);
    perform communication.notify(invitee, 'room_invite', room.id, jsonb_build_object('roomId', room.id, 'name', room.name));
  end loop;

  return communication.ok(jsonb_build_object('inviteeIds', to_jsonb(created)));
end;
$$;

create or replace function public.communication_respond_room_invite(p_invite_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  invite public.communication_room_invites;
begin
  actor := communication.require_actor();
  select * into invite from public.communication_room_invites where id = p_invite_id for update;
  if not found or invite.invitee_id <> actor then
    return communication.fail('ROOM_UNAVAILABLE', 'Convite indisponível.');
  end if;
  if invite.state <> 'pending' then
    if invite.state = 'accepted' and p_accept then
      return communication.ok(to_jsonb(invite));
    end if;
    return communication.fail('INVITE_EXPIRED', 'Este convite já foi respondido.');
  end if;
  if invite.expires_at <= now() then
    update public.communication_room_invites set state = 'expired', responded_at = now() where id = invite.id;
    return communication.fail('INVITE_EXPIRED', 'Convite expirado.');
  end if;

  if p_accept then
    insert into public.communication_room_members (room_id, user_id, role)
    values (invite.room_id, actor, 'member')
    on conflict do nothing;
    update public.communication_room_invites
    set state = 'accepted', responded_at = now()
    where id = invite.id
    returning * into invite;
  else
    update public.communication_room_invites
    set state = 'declined', responded_at = now()
    where id = invite.id
    returning * into invite;
  end if;

  return communication.ok(to_jsonb(invite));
end;
$$;

create or replace function public.communication_remove_member(p_room_id uuid, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  room public.communication_rooms;
  role text;
  target_role text;
  session_row public.communication_sessions;
begin
  actor := communication.require_actor();
  select * into room from public.communication_rooms where id = p_room_id;
  if not found or not communication.can_see_room(room, actor) then
    return communication.fail('ROOM_UNAVAILABLE', 'Sala indisponível.');
  end if;
  role := communication.room_role(room.id, actor);
  target_role := communication.room_role(room.id, p_user_id);
  if role not in ('owner', 'moderator') then
    return communication.fail('ACTION_DENIED', 'Sem permissão para remover.');
  end if;
  if target_role = 'owner' then
    return communication.fail('ACTION_DENIED', 'O proprietário não pode ser removido.');
  end if;
  if p_user_id = actor and role = 'owner' then
    return communication.fail('ACTION_DENIED', 'Transfira a propriedade ou arquive a sala.');
  end if;

  delete from public.communication_room_members where room_id = room.id and user_id = p_user_id;
  update public.communication_room_invites
  set state = 'revoked', responded_at = now()
  where room_id = room.id and invitee_id = p_user_id and state = 'pending';

  for session_row in
    select * from public.communication_sessions where room_id = room.id and state <> 'ended'
  loop
    update public.communication_participations
    set state = 'removed', left_at = now(), leave_reason = 'membership_revoked'
    where session_id = session_row.id and user_id = p_user_id and state in ('reserved', 'joined', 'reconnecting');
    delete from public.communication_user_leases where user_id = p_user_id;
    insert into public.communication_session_restrictions (session_id, user_id, removed, actor_id)
    values (session_row.id, p_user_id, true, actor)
    on conflict (session_id, user_id) do update set removed = true, actor_id = actor, version = communication_session_restrictions.version + 1;
    perform communication.enqueue(
      'remove:' || session_row.id::text || ':' || p_user_id::text || ':' || extract(epoch from now())::text,
      'remove_participant',
      session_row.provider_room_name,
      jsonb_build_object('userId', p_user_id, 'sessionId', session_row.id)
    );
  end loop;

  perform communication.audit('member_removed', null, room.id, actor, jsonb_build_object('userId', p_user_id));
  return communication.ok();
end;
$$;

create or replace function public.communication_patch_member_role(p_room_id uuid, p_user_id uuid, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  room public.communication_rooms;
begin
  actor := communication.require_actor();
  select * into room from public.communication_rooms where id = p_room_id;
  if not found or not communication.can_see_room(room, actor) then
    return communication.fail('ROOM_UNAVAILABLE', 'Sala indisponível.');
  end if;
  if communication.room_role(room.id, actor) is distinct from 'owner' then
    return communication.fail('ACTION_DENIED', 'Somente o proprietário altera moderadores.');
  end if;
  if p_role not in ('moderator', 'member') then
    return communication.fail('ACTION_DENIED', 'Papel inválido.');
  end if;
  if communication.room_role(room.id, p_user_id) = 'owner' then
    return communication.fail('ACTION_DENIED', 'O proprietário não muda por este caminho.');
  end if;
  update public.communication_room_members
  set role = p_role
  where room_id = room.id and user_id = p_user_id;
  if not found then
    return communication.fail('ACTION_DENIED', 'Membro não encontrado.');
  end if;
  return communication.ok();
end;
$$;

create or replace function public.communication_transfer_room(p_room_id uuid, p_new_owner uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  room public.communication_rooms;
begin
  actor := communication.require_actor();
  select * into room from public.communication_rooms where id = p_room_id for update;
  if not found or not communication.can_see_room(room, actor) then
    return communication.fail('ROOM_UNAVAILABLE', 'Sala indisponível.');
  end if;
  if room.owner_id <> actor then
    return communication.fail('ACTION_DENIED', 'Somente o proprietário transfere a sala.');
  end if;
  if not exists (select 1 from public.communication_room_members where room_id = room.id and user_id = p_new_owner) then
    return communication.fail('ACTION_DENIED', 'O novo dono precisa ser membro.');
  end if;

  update public.communication_room_members set role = 'member' where room_id = room.id and user_id = actor;
  update public.communication_room_members set role = 'owner' where room_id = room.id and user_id = p_new_owner;
  update public.communication_rooms set owner_id = p_new_owner, version = version + 1 where id = room.id;
  perform communication.audit('room_transferred', null, room.id, actor, jsonb_build_object('newOwnerId', p_new_owner));
  return communication.ok();
end;
$$;

create or replace function communication.promote_direct_moderator(session_id uuid)
returns void
language plpgsql
as $$
declare
  next_user uuid;
begin
  select p.user_id into next_user
  from public.communication_participations p
  where p.session_id = session_id and p.state in ('joined', 'reconnecting')
  order by p.joined_at nulls last, p.user_id
  limit 1;

  update public.communication_sessions
  set moderator_id = next_user
  where id = session_id and kind = 'direct';
end;
$$;

create or replace function public.communication_create_call(p_invitee_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  session_row public.communication_sessions;
  invitee uuid;
  created_invite uuid;
  invite_ids uuid[] := array[]::uuid[];
begin
  actor := communication.require_actor();
  if coalesce(array_length(p_invitee_ids, 1), 0) < 1 then
    return communication.fail('ACTION_DENIED', 'Escolha ao menos uma pessoa.');
  end if;

  insert into public.communication_sessions (
    kind, initiator_id, moderator_id, provider_room_name, state
  ) values (
    'direct', actor, actor, 'direct-' || gen_random_uuid()::text, 'waiting'
  ) returning * into session_row;

  foreach invitee in array p_invitee_ids
  loop
    if invitee = actor or not communication.is_onboarded(invitee) then
      continue;
    end if;
    insert into public.communication_call_invites (session_id, inviter_id, invitee_id, state, expires_at)
    values (session_row.id, actor, invitee, 'ringing', now() + make_interval(secs => communication.setting_int('ring_seconds', 30)))
    returning id into created_invite;
    invite_ids := array_append(invite_ids, created_invite);
  end loop;

  if coalesce(array_length(invite_ids, 1), 0) < 1 then
    update public.communication_sessions set state = 'ended', ended_at = now() where id = session_row.id;
    return communication.fail('ACTION_DENIED', 'Nenhum destinatário válido.');
  end if;

  return communication.ok(jsonb_build_object('session', to_jsonb(session_row), 'inviteIds', to_jsonb(invite_ids)));
end;
$$;

create or replace function public.communication_invite_to_call(p_session_id uuid, p_invitee_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  session_row public.communication_sessions;
  invitee uuid;
begin
  actor := communication.require_actor();
  select * into session_row from public.communication_sessions where id = p_session_id for update;
  if not found or session_row.state in ('ending', 'ended') then
    return communication.fail('ROOM_UNAVAILABLE', 'Chamada indisponível.');
  end if;
  if session_row.kind <> 'direct' or session_row.moderator_id <> actor then
    return communication.fail('ACTION_DENIED', 'Somente o moderador convida nesta chamada.');
  end if;
  if communication.active_occupancy(session_row.id) >= communication.setting_int('max_participants', 12) then
    return communication.fail('ROOM_FULL', 'A chamada está cheia.');
  end if;

  foreach invitee in array coalesce(p_invitee_ids, array[]::uuid[])
  loop
    if invitee = actor or not communication.is_onboarded(invitee) then
      continue;
    end if;
    insert into public.communication_call_invites (session_id, inviter_id, invitee_id, state, expires_at)
    values (session_row.id, actor, invitee, 'ringing', now() + make_interval(secs => communication.setting_int('ring_seconds', 30)));
    perform communication.notify(invitee, 'incoming_call', session_row.id, jsonb_build_object('sessionId', session_row.id));
  end loop;
  return communication.ok();
end;
$$;

create or replace function public.communication_respond_call_invite(p_invite_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  invite public.communication_call_invites;
  session_row public.communication_sessions;
begin
  actor := communication.require_actor();
  select * into invite from public.communication_call_invites where id = p_invite_id for update;
  if not found or invite.invitee_id <> actor then
    return communication.fail('ROOM_UNAVAILABLE', 'Convite indisponível.');
  end if;
  select * into session_row from public.communication_sessions where id = invite.session_id for update;
  if invite.state <> 'ringing' or session_row.state in ('ending', 'ended') or invite.expires_at <= now() then
    if invite.state = 'ringing' and invite.expires_at <= now() then
      update public.communication_call_invites set state = 'expired', responded_at = now() where id = invite.id;
    end if;
    return communication.fail('INVITE_EXPIRED', 'Esta chamada não pode mais ser aceita.');
  end if;

  if not p_accept then
    update public.communication_call_invites set state = 'declined', responded_at = now() where id = invite.id returning * into invite;
    if not exists (
      select 1 from public.communication_call_invites
      where session_id = session_row.id and state in ('ringing', 'accepted')
    ) and session_row.state = 'waiting' then
      update public.communication_sessions set state = 'ended', ended_at = now(), version = version + 1 where id = session_row.id;
    end if;
    return communication.ok(to_jsonb(invite));
  end if;

  update public.communication_call_invites
  set state = 'accepted', responded_at = now()
  where id = invite.id and state = 'ringing'
  returning * into invite;
  if not found then
    return communication.fail('INVITE_EXPIRED', 'Esta chamada não pode mais ser aceita.');
  end if;

  if session_row.state = 'waiting' then
    update public.communication_sessions
    set state = 'active', started_at = coalesce(started_at, now())
    where id = session_row.id and state = 'waiting';
  end if;

  return communication.ok(to_jsonb(invite));
end;
$$;

create or replace function public.communication_cancel_call(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  session_row public.communication_sessions;
begin
  actor := communication.require_actor();
  select * into session_row from public.communication_sessions where id = p_session_id for update;
  if not found or session_row.initiator_id <> actor then
    return communication.fail('ACTION_DENIED', 'Somente quem iniciou pode cancelar.');
  end if;
  if session_row.state <> 'waiting' then
    return communication.fail('ACTION_DENIED', 'A chamada já foi atendida.');
  end if;
  update public.communication_call_invites
  set state = 'cancelled', responded_at = now()
  where session_id = session_row.id and state = 'ringing';
  update public.communication_sessions
  set state = 'ended', ended_at = now(), version = version + 1
  where id = session_row.id;
  return communication.ok();
end;
$$;

create or replace function communication.take_user_lease(
  actor uuid,
  participation public.communication_participations,
  takeover boolean
)
returns jsonb
language plpgsql
as $$
declare
  lease public.communication_user_leases;
begin
  select * into lease from public.communication_user_leases where user_id = actor for update;
  if found then
    if lease.participation_id = participation.id then
      update public.communication_user_leases
      set generation = participation.generation, expires_at = now() + interval '45 seconds'
      where user_id = actor;
      return communication.ok();
    end if;
    if not takeover and lease.expires_at > now() then
      return communication.fail('SESSION_CONFLICT', 'Você já está em outra sessão.');
    end if;
    update public.communication_participations
    set state = 'removed', left_at = now(), leave_reason = 'taken_over'
    where id = lease.participation_id and state in ('reserved', 'joined', 'reconnecting');
  end if;

  insert into public.communication_user_leases (user_id, participation_id, generation, expires_at)
  values (actor, participation.id, participation.generation, now() + interval '45 seconds')
  on conflict (user_id) do update
    set participation_id = excluded.participation_id,
        generation = excluded.generation,
        expires_at = excluded.expires_at;
  return communication.ok();
end;
$$;

create or replace function public.communication_join(
  p_room_id uuid,
  p_session_id uuid,
  p_device_session_id text,
  p_takeover boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  room public.communication_rooms;
  session_row public.communication_sessions;
  participation public.communication_participations;
  restriction public.communication_session_restrictions;
  lease_result jsonb;
  capabilities jsonb;
begin
  actor := communication.require_actor();
  perform communication.expire_pending();

  if p_session_id is not null then
    select * into session_row from public.communication_sessions where id = p_session_id for update;
    if not found or session_row.state in ('ending', 'ended') then
      return communication.fail('ROOM_UNAVAILABLE', 'Sessão indisponível.');
    end if;
    if session_row.room_id is not null then
      select * into room from public.communication_rooms where id = session_row.room_id;
    end if;
  elsif p_room_id is not null then
    select * into room from public.communication_rooms where id = p_room_id for update;
    if not found or not communication.can_enter_room(room, actor) then
      return communication.fail('ROOM_UNAVAILABLE', 'Sala indisponível.');
    end if;
    if room.locked_at is not null then
      return communication.fail('ROOM_LOCKED', 'Novas entradas estão bloqueadas.');
    end if;
    select * into session_row
    from public.communication_sessions
    where room_id = room.id and state <> 'ended'
    for update;
    if not found then
      insert into public.communication_sessions (room_id, kind, initiator_id, provider_room_name, state, started_at)
      values (room.id, 'room', actor, 'room-' || room.id::text, 'active', now())
      returning * into session_row;
    end if;
  else
    return communication.fail('ACTION_DENIED', 'Informe a sala ou a sessão.');
  end if;

  if room.id is not null then
    if not communication.can_enter_room(room, actor) then
      return communication.fail('ROOM_UNAVAILABLE', 'Sala indisponível.');
    end if;
    if room.locked_at is not null then
      return communication.fail('ROOM_LOCKED', 'Novas entradas estão bloqueadas.');
    end if;
  elsif session_row.kind = 'direct' then
    if session_row.initiator_id <> actor and not exists (
      select 1 from public.communication_call_invites
      where session_id = session_row.id and invitee_id = actor and state = 'accepted'
    ) then
      return communication.fail('ACTION_DENIED', 'Aceite o convite antes de entrar.');
    end if;
  end if;

  select * into restriction
  from public.communication_session_restrictions
  where session_id = session_row.id and user_id = actor;
  if found and restriction.removed then
    return communication.fail('ACTION_DENIED', 'Você foi removido desta sessão.');
  end if;

  if communication.active_occupancy(session_row.id) >= communication.setting_int('max_participants', 12)
     and not exists (
       select 1 from public.communication_participations
       where session_id = session_row.id and user_id = actor and state in ('joined', 'reconnecting', 'reserved')
     ) then
    return communication.fail('ROOM_FULL', 'A sala está cheia.');
  end if;

  insert into public.communication_participations (
    session_id, user_id, connection_id, generation, state, reserved_until
  ) values (
    session_row.id,
    actor,
    p_device_session_id,
    coalesce((select max(generation) + 1 from public.communication_participations where session_id = session_row.id and user_id = actor), 1),
    'reserved',
    now() + make_interval(secs => communication.setting_int('reserve_seconds', 30))
  ) returning * into participation;

  lease_result := communication.take_user_lease(actor, participation, coalesce(p_takeover, false));
  if (lease_result ->> 'ok') = 'false' then
    delete from public.communication_participations where id = participation.id;
    return lease_result;
  end if;

  if session_row.state = 'waiting' and session_row.initiator_id = actor then
    update public.communication_sessions
    set state = 'waiting'
    where id = session_row.id;
    update public.communication_call_invites
    set expires_at = greatest(expires_at, now() + make_interval(secs => communication.setting_int('ring_seconds', 30)))
    where session_id = session_row.id and state = 'ringing';
    perform communication.notify(i.invitee_id, 'incoming_call', session_row.id, jsonb_build_object('sessionId', session_row.id, 'inviteId', i.id))
    from public.communication_call_invites i
    where i.session_id = session_row.id and i.state = 'ringing';
  elsif session_row.state = 'waiting' then
    update public.communication_sessions
    set state = 'active', started_at = coalesce(started_at, now()), empty_since = null
    where id = session_row.id;
  else
    update public.communication_sessions set empty_since = null, started_at = coalesce(started_at, now()) where id = session_row.id;
  end if;

  capabilities := jsonb_build_object(
    'microphone', coalesce(not restriction.deny_mic, true),
    'camera', coalesce(not restriction.deny_camera, true),
    'screen', coalesce(not restriction.deny_screen, true)
  );

  return communication.ok(jsonb_build_object(
    'sessionId', session_row.id,
    'participationId', participation.id,
    'generation', participation.generation,
    'providerRoomName', session_row.provider_room_name,
    'kind', session_row.kind,
    'roomId', session_row.room_id,
    'capabilities', capabilities
  ));
end;
$$;

create or replace function public.communication_mark_joined(
  p_participation_id uuid,
  p_generation integer,
  p_connection_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
begin
  actor := communication.require_actor();
  update public.communication_participations
  set state = 'joined', joined_at = coalesce(joined_at, now()), connection_id = p_connection_id
  where id = p_participation_id and user_id = actor and generation = p_generation and state in ('reserved', 'reconnecting', 'joined');
  update public.communication_user_leases
  set expires_at = now() + interval '45 seconds'
  where user_id = actor and participation_id = p_participation_id;
  return communication.ok();
end;
$$;

create or replace function public.communication_leave(
  p_session_id uuid,
  p_participation_id uuid,
  p_generation integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  session_row public.communication_sessions;
  participation public.communication_participations;
begin
  actor := communication.require_actor();
  select * into participation
  from public.communication_participations
  where id = p_participation_id and session_id = p_session_id and user_id = actor;
  if not found then
    return communication.ok();
  end if;
  if participation.generation = p_generation and participation.state in ('reserved', 'joined', 'reconnecting') then
    update public.communication_participations
    set state = 'left', left_at = now(), leave_reason = 'left'
    where id = participation.id;
    update public.communication_media_leases
    set state = 'released'
    where participation_id = participation.id and state in ('reserved', 'published');
  end if;
  delete from public.communication_user_leases
  where user_id = actor and participation_id = participation.id and generation = p_generation;

  select * into session_row from public.communication_sessions where id = p_session_id;
  if session_row.kind = 'direct' and session_row.moderator_id = actor then
    perform communication.promote_direct_moderator(session_row.id);
  end if;
  return communication.ok();
end;
$$;

create or replace function public.communication_renew(
  p_session_id uuid,
  p_participation_id uuid,
  p_generation integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  participation public.communication_participations;
  session_row public.communication_sessions;
begin
  actor := communication.require_actor();
  select * into participation from public.communication_participations
  where id = p_participation_id and session_id = p_session_id and user_id = actor and generation = p_generation;
  if not found or participation.state not in ('reserved', 'joined', 'reconnecting') then
    return communication.fail('SESSION_CONFLICT', 'Participação inválida.');
  end if;
  select * into session_row from public.communication_sessions where id = p_session_id;
  if session_row.state in ('ending', 'ended') then
    return communication.fail('ROOM_UNAVAILABLE', 'Sessão encerrada.');
  end if;
  update public.communication_user_leases
  set expires_at = now() + interval '45 seconds'
  where user_id = actor and participation_id = participation.id and generation = p_generation;
  if not found then
    return communication.fail('SESSION_CONFLICT', 'Lease ausente.');
  end if;
  return communication.ok(jsonb_build_object(
    'sessionId', session_row.id,
    'participationId', participation.id,
    'generation', participation.generation,
    'providerRoomName', session_row.provider_room_name
  ));
end;
$$;

create or replace function public.communication_takeover(
  p_room_id uuid,
  p_session_id uuid,
  p_device_session_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
begin
  return public.communication_join(p_room_id, p_session_id, p_device_session_id, true);
end;
$$;

create or replace function public.communication_reserve_publication(
  p_session_id uuid,
  p_participation_id uuid,
  p_source text
)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  participation public.communication_participations;
  restriction public.communication_session_restrictions;
  max_slots integer;
  used integer;
  slot integer;
  lease public.communication_media_leases;
  ttl interval;
begin
  actor := communication.require_actor();
  if p_source not in ('camera', 'screen') then
    return communication.fail('ACTION_DENIED', 'Fonte inválida.');
  end if;
  select * into participation
  from public.communication_participations
  where id = p_participation_id and session_id = p_session_id and user_id = actor
    and state in ('reserved', 'joined', 'reconnecting');
  if not found then
    return communication.fail('ACTION_DENIED', 'Participação inválida.');
  end if;
  select * into restriction from public.communication_session_restrictions
  where session_id = p_session_id and user_id = actor;
  if found and ((p_source = 'camera' and restriction.deny_camera) or (p_source = 'screen' and restriction.deny_screen)) then
    return communication.fail('ACTION_DENIED', 'Publicação bloqueada pelo moderador.');
  end if;

  max_slots := case when p_source = 'camera' then communication.setting_int('max_cameras', 6) else communication.setting_int('max_screens', 1) end;
  select count(*) into used from public.communication_media_leases
  where session_id = p_session_id and source = p_source and state in ('reserved', 'published');
  if used >= max_slots then
    if p_source = 'screen' then
      return communication.fail('PRESENTATION_BUSY', 'Outra pessoa começou a apresentar.');
    end if;
    return communication.fail('ROOM_FULL', 'Limite de câmeras atingido.');
  end if;

  slot := used + 1;
  ttl := case when p_source = 'screen' then make_interval(secs => communication.setting_int('screen_reserve_seconds', 15)) else interval '30 seconds' end;

  insert into public.communication_media_leases (session_id, source, slot, participation_id, expires_at, state)
  values (p_session_id, p_source, slot, participation.id, now() + ttl, 'reserved')
  returning * into lease;

  return communication.ok(to_jsonb(lease));
exception
  when unique_violation then
    if p_source = 'screen' then
      return communication.fail('PRESENTATION_BUSY', 'Outra pessoa começou a apresentar.');
    end if;
    return communication.fail('ROOM_FULL', 'Limite de câmeras atingido.');
end;
$$;

create or replace function public.communication_release_publication(
  p_session_id uuid,
  p_participation_id uuid,
  p_source text
)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
begin
  actor := communication.require_actor();
  update public.communication_media_leases l
  set state = 'released'
  from public.communication_participations p
  where l.participation_id = p.id
    and p.id = p_participation_id
    and p.user_id = actor
    and l.session_id = p_session_id
    and l.source = p_source
    and l.state in ('reserved', 'published');
  return communication.ok();
end;
$$;

create or replace function public.communication_publish_ok(
  p_lease_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
begin
  actor := communication.require_actor();
  update public.communication_media_leases l
  set state = 'published', expires_at = null
  from public.communication_participations p
  where l.id = p_lease_id and l.participation_id = p.id and p.user_id = actor and l.state = 'reserved';
  return communication.ok();
end;
$$;

create or replace function public.communication_moderate(
  p_session_id uuid,
  p_target_user_id uuid,
  p_action text,
  p_source text
)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  session_row public.communication_sessions;
  actor_role text;
  target_role text;
  can_mod boolean := false;
begin
  actor := communication.require_actor();
  select * into session_row from public.communication_sessions where id = p_session_id for update;
  if not found or session_row.state in ('ending', 'ended') then
    return communication.fail('ROOM_UNAVAILABLE', 'Sessão indisponível.');
  end if;
  if session_row.kind = 'direct' then
    can_mod := session_row.moderator_id = actor;
  else
    actor_role := communication.room_role(session_row.room_id, actor);
    target_role := communication.room_role(session_row.room_id, p_target_user_id);
    can_mod := actor_role in ('owner', 'moderator') and target_role is distinct from 'owner';
  end if;
  if not can_mod or p_target_user_id = actor then
    return communication.fail('ACTION_DENIED', 'Sem permissão de moderação.');
  end if;

  if p_action = 'remove' then
    update public.communication_participations
    set state = 'removed', left_at = now(), leave_reason = 'removed'
    where session_id = session_row.id and user_id = p_target_user_id and state in ('reserved', 'joined', 'reconnecting');
    delete from public.communication_user_leases where user_id = p_target_user_id;
    insert into public.communication_session_restrictions (session_id, user_id, removed, actor_id)
    values (session_row.id, p_target_user_id, true, actor)
    on conflict (session_id, user_id) do update set removed = true, actor_id = actor, version = communication_session_restrictions.version + 1;
    perform communication.enqueue(
      'remove:' || session_row.id::text || ':' || p_target_user_id::text,
      'remove_participant',
      session_row.provider_room_name,
      jsonb_build_object('userId', p_target_user_id, 'sessionId', session_row.id)
    );
  elsif p_action in ('deny-source', 'allow-source') then
    insert into public.communication_session_restrictions (session_id, user_id, actor_id, deny_mic, deny_camera, deny_screen)
    values (
      session_row.id,
      p_target_user_id,
      actor,
      p_source = 'microphone' and p_action = 'deny-source',
      p_source = 'camera' and p_action = 'deny-source',
      p_source = 'screen' and p_action = 'deny-source'
    )
    on conflict (session_id, user_id) do update
      set deny_mic = case when p_source = 'microphone' then p_action = 'deny-source' else communication_session_restrictions.deny_mic end,
          deny_camera = case when p_source = 'camera' then p_action = 'deny-source' else communication_session_restrictions.deny_camera end,
          deny_screen = case when p_source = 'screen' then p_action = 'deny-source' else communication_session_restrictions.deny_screen end,
          actor_id = actor,
          version = communication_session_restrictions.version + 1;
    if p_action = 'deny-source' then
      update public.communication_media_leases l
      set state = 'released'
      from public.communication_participations p
      where l.participation_id = p.id and p.session_id = session_row.id and p.user_id = p_target_user_id
        and l.source = case when p_source = 'camera' then 'camera' when p_source = 'screen' then 'screen' else l.source end
        and l.state in ('reserved', 'published');
      perform communication.enqueue(
        'mute:' || session_row.id::text || ':' || p_target_user_id::text || ':' || coalesce(p_source, ''),
        'mute_published_track',
        session_row.provider_room_name,
        jsonb_build_object('userId', p_target_user_id, 'source', p_source, 'sessionId', session_row.id)
      );
    end if;
  else
    return communication.fail('ACTION_DENIED', 'Ação inválida.');
  end if;

  perform communication.audit('moderation', session_row.id, session_row.room_id, actor, jsonb_build_object('action', p_action, 'targetUserId', p_target_user_id, 'source', p_source));
  return communication.ok(jsonb_build_object('pending', true));
end;
$$;

create or replace function public.communication_end_session(p_session_id uuid, p_expected_version integer)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
  session_row public.communication_sessions;
  can_end boolean := false;
begin
  actor := communication.require_actor();
  select * into session_row from public.communication_sessions where id = p_session_id for update;
  if not found then
    return communication.fail('ROOM_UNAVAILABLE', 'Sessão indisponível.');
  end if;
  if session_row.version <> p_expected_version then
    return communication.fail('VERSION_CONFLICT', 'A sessão mudou.');
  end if;
  if session_row.kind = 'direct' then
    can_end := session_row.moderator_id = actor;
  else
    can_end := communication.room_role(session_row.room_id, actor) in ('owner', 'moderator');
  end if;
  if not can_end then
    return communication.fail('ACTION_DENIED', 'Sem permissão para encerrar.');
  end if;
  if session_row.state = 'ended' then
    return communication.ok(to_jsonb(session_row));
  end if;

  update public.communication_sessions
  set state = 'ended', ended_at = now(), version = version + 1
  where id = session_row.id
  returning * into session_row;
  update public.communication_participations
  set state = case when state in ('left', 'removed') then state else 'removed' end,
      left_at = coalesce(left_at, now()),
      leave_reason = coalesce(leave_reason, 'ended')
  where session_id = session_row.id and state in ('reserved', 'joined', 'reconnecting');
  perform communication.enqueue(
    'end:' || session_row.id::text,
    'end_provider_room',
    session_row.provider_room_name,
    jsonb_build_object('sessionId', session_row.id)
  );
  perform communication.audit('session_ended', session_row.id, session_row.room_id, actor, '{}'::jsonb);
  return communication.ok(to_jsonb(session_row));
end;
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
    where p.onboarding_completed = true
      and p.id <> actor
      and p.role in ('admin', 'coordinator', 'traffic', 'creator')
  ), '[]'::jsonb));
end;
$$;

create or replace function public.communication_read_notification(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
declare
  actor uuid;
begin
  actor := communication.require_actor();
  update public.communication_notifications
  set read_at = now()
  where id = p_id and recipient_id = actor;
  if not found then
    return communication.fail('ROOM_UNAVAILABLE', 'Notificação indisponível.');
  end if;
  return communication.ok();
end;
$$;

create or replace function public.communication_confirm_joined_service(
  p_participation_id uuid,
  p_generation integer,
  p_connection_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.communication_participations
  set state = 'joined', joined_at = coalesce(joined_at, now()), connection_id = p_connection_id
  where id = p_participation_id and generation = p_generation and state in ('reserved', 'reconnecting', 'joined');
end;
$$;

create or replace function public.communication_record_provider_event(
  p_event_id text,
  p_type text
)
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
begin
  insert into public.communication_provider_events (event_id, type)
  values (p_event_id, p_type);
  return communication.ok(jsonb_build_object('duplicate', false));
exception
  when unique_violation then
    return communication.ok(jsonb_build_object('duplicate', true));
end;
$$;

create or replace function public.communication_finish_provider_event(p_event_id text, p_outcome text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.communication_provider_events
  set processed_at = now(), outcome = p_outcome
  where event_id = p_event_id;
$$;

create or replace function public.communication_tick()
returns jsonb
language plpgsql
security definer
set search_path = public, communication
as $$
begin
  perform communication.expire_pending();
  return communication.ok();
end;
$$;

alter table public.communication_rooms enable row level security;
alter table public.communication_room_members enable row level security;
alter table public.communication_room_invites enable row level security;
alter table public.communication_sessions enable row level security;
alter table public.communication_call_invites enable row level security;
alter table public.communication_participations enable row level security;
alter table public.communication_user_leases enable row level security;
alter table public.communication_media_leases enable row level security;
alter table public.communication_session_restrictions enable row level security;
alter table public.communication_events enable row level security;
alter table public.communication_provider_events enable row level security;
alter table public.communication_notifications enable row level security;
alter table public.communication_outbox enable row level security;
alter table public.communication_idempotency enable row level security;

create policy rooms_select on public.communication_rooms
for select to authenticated
using (communication.can_see_room(communication_rooms, (select auth.uid())));

create policy members_select on public.communication_room_members
for select to authenticated
using (
  exists (
    select 1 from public.communication_rooms r
    where r.id = room_id and communication.can_see_room(r, (select auth.uid()))
  )
);

create policy room_invites_select on public.communication_room_invites
for select to authenticated
using (invitee_id = (select auth.uid()) or inviter_id = (select auth.uid()));

create policy sessions_select on public.communication_sessions
for select to authenticated
using (communication.can_see_session(communication_sessions, (select auth.uid())));

create policy call_invites_select on public.communication_call_invites
for select to authenticated
using (invitee_id = (select auth.uid()) or inviter_id = (select auth.uid()));

create policy participations_select on public.communication_participations
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.communication_sessions s
    where s.id = session_id and communication.can_see_session(s, (select auth.uid()))
  )
);

create policy restrictions_select on public.communication_session_restrictions
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.communication_sessions s
    where s.id = session_id and communication.can_see_session(s, (select auth.uid()))
  )
);

create policy notifications_select on public.communication_notifications
for select to authenticated
using (recipient_id = (select auth.uid()));

create policy media_leases_select on public.communication_media_leases
for select to authenticated
using (
  exists (
    select 1 from public.communication_participations p
    where p.id = participation_id and p.user_id = (select auth.uid())
  )
);

revoke all on public.communication_rooms from anon, authenticated;
revoke all on public.communication_room_members from anon, authenticated;
revoke all on public.communication_room_invites from anon, authenticated;
revoke all on public.communication_sessions from anon, authenticated;
revoke all on public.communication_call_invites from anon, authenticated;
revoke all on public.communication_participations from anon, authenticated;
revoke all on public.communication_user_leases from anon, authenticated;
revoke all on public.communication_media_leases from anon, authenticated;
revoke all on public.communication_session_restrictions from anon, authenticated;
revoke all on public.communication_events from anon, authenticated;
revoke all on public.communication_provider_events from anon, authenticated;
revoke all on public.communication_notifications from anon, authenticated;
revoke all on public.communication_outbox from anon, authenticated;
revoke all on public.communication_idempotency from anon, authenticated;

grant select on public.communication_rooms to authenticated;
grant select on public.communication_room_members to authenticated;
grant select on public.communication_room_invites to authenticated;
grant select on public.communication_sessions to authenticated;
grant select on public.communication_call_invites to authenticated;
grant select on public.communication_participations to authenticated;
grant select on public.communication_session_restrictions to authenticated;
grant select on public.communication_notifications to authenticated;
grant select on public.communication_media_leases to authenticated;

revoke all on function communication.ok(jsonb) from public, anon, authenticated;
revoke all on function communication.fail(text, text, boolean) from public, anon, authenticated;
revoke all on function communication.actor_id() from public, anon, authenticated;
revoke all on function communication.is_onboarded(uuid) from public, anon, authenticated;
revoke all on function communication.notify(uuid, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function communication.audit(text, uuid, uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function communication.enqueue(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function communication.can_see_room(public.communication_rooms, uuid) from public, anon, authenticated;
revoke all on function communication.room_role(uuid, uuid) from public, anon, authenticated;
revoke all on function communication.can_enter_room(public.communication_rooms, uuid) from public, anon, authenticated;
revoke all on function communication.can_see_session(public.communication_sessions, uuid) from public, anon, authenticated;
revoke all on function communication.active_occupancy(uuid) from public, anon, authenticated;
revoke all on function communication.expire_pending() from public, anon, authenticated;
revoke all on function communication.require_actor() from public, anon, authenticated;
revoke all on function communication.take_user_lease(uuid, public.communication_participations, boolean) from public, anon, authenticated;
revoke all on function communication.promote_direct_moderator(uuid) from public, anon, authenticated;
revoke all on function communication.setting_int(text, integer) from public, anon, authenticated;

grant execute on function communication.can_see_room(public.communication_rooms, uuid) to authenticated;
grant execute on function communication.can_see_session(public.communication_sessions, uuid) to authenticated;
grant execute on function communication.can_enter_room(public.communication_rooms, uuid) to authenticated;

do $$
declare
  fn record;
begin
  for fn in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'communication_%'
  loop
    execute format('revoke all on function public.%I(%s) from public, anon', fn.proname, fn.args);
    execute format('grant execute on function public.%I(%s) to authenticated, service_role', fn.proname, fn.args);
  end loop;
end $$;

alter table public.communication_notifications replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.communication_notifications;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;

do $$
begin
  begin
    create extension if not exists pg_cron;
    perform cron.schedule(
      'communication-tick',
      '30 seconds',
      $cron$select public.communication_tick();$cron$
    );
  exception
    when others then
      raise notice 'pg_cron indisponível: %', sqlerrm;
  end;
end $$;
