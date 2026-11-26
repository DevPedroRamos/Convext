create or replace function communication.mark_incoming_call_notifications_read(p_recipient_id uuid, p_session_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.communication_notifications
  set read_at = coalesce(read_at, now())
  where recipient_id = p_recipient_id
    and kind = 'incoming_call'
    and reference_id = p_session_id
    and read_at is null;
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

    perform communication.mark_incoming_call_notifications_read(invite.invitee_id, invite.session_id);

    select * into session_row from public.communication_sessions where id = invite.session_id;
    if session_row.state = 'waiting' and not exists (
      select 1
      from public.communication_call_invites
      where session_id = session_row.id and state in ('ringing', 'accepted')
    ) then
      update public.communication_sessions
      set state = 'ended', ended_at = now(), version = version + 1
      where id = session_row.id and state = 'waiting';
      perform communication.audit('call_unanswered', session_row.id, null, null, '{}'::jsonb);
    end if;
  end loop;

  update public.communication_participations p
  set state = 'left',
      left_at = coalesce(p.left_at, now()),
      leave_reason = 'lease_expired'
  where p.state in ('joined', 'reconnecting')
    and not exists (
      select 1
      from public.communication_user_leases l
      where l.user_id = p.user_id
        and l.participation_id = p.id
        and l.generation = p.generation
        and l.expires_at > now()
    );

  update public.communication_participations
  set state = 'left', left_at = now(), leave_reason = 'reservation_expired'
  where state = 'reserved' and reserved_until <= now();

  update public.communication_media_leases l
  set state = 'released'
  from public.communication_participations p
  where l.participation_id = p.id
    and l.state in ('reserved', 'published')
    and (
      (p.state = 'left' and p.leave_reason in ('lease_expired', 'reservation_expired'))
      or (l.expires_at is not null and l.expires_at <= now())
    );

  delete from public.communication_user_leases where expires_at <= now();

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
        set state = 'ended', ended_at = now(), version = version + 1
        where id = session_row.id and state <> 'ended';
        perform communication.enqueue(
          'end:' || session_row.id::text,
          'end_provider_room',
          session_row.provider_room_name,
          jsonb_build_object('sessionId', session_row.id)
        );
      end if;
    else
      update public.communication_sessions
      set empty_since = null
      where id = session_row.id and empty_since is not null;
    end if;
  end loop;

  delete from public.communication_provider_events where received_at <= now() - interval '7 days';
  delete from public.communication_events where created_at <= now() - interval '30 days';
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
    perform communication.mark_incoming_call_notifications_read(actor, invite.session_id);
    return communication.fail('INVITE_EXPIRED', 'Esta chamada não pode mais ser aceita.');
  end if;

  if not p_accept then
    update public.communication_call_invites set state = 'declined', responded_at = now() where id = invite.id returning * into invite;
    perform communication.mark_incoming_call_notifications_read(actor, invite.session_id);
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
    perform communication.mark_incoming_call_notifications_read(actor, session_row.id);
    return communication.fail('INVITE_EXPIRED', 'Esta chamada não pode mais ser aceita.');
  end if;

  perform communication.mark_incoming_call_notifications_read(actor, session_row.id);

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
  update public.communication_notifications
  set read_at = coalesce(read_at, now())
  where kind = 'incoming_call' and reference_id = session_row.id and read_at is null;
  update public.communication_sessions
  set state = 'ended', ended_at = now(), version = version + 1
  where id = session_row.id;
  return communication.ok();
end;
$$;

update public.communication_notifications n
set read_at = now()
where n.kind = 'incoming_call'
  and n.read_at is null
  and not exists (
    select 1
    from public.communication_call_invites i
    where i.invitee_id = n.recipient_id
      and i.session_id = n.reference_id
      and i.state = 'ringing'
      and i.expires_at > now()
  );
