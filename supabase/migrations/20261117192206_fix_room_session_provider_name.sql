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
      values (room.id, 'room', actor, format('room-%s-%s', room.id, gen_random_uuid()), 'active', now())
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
