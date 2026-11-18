create or replace function communication.active_occupancy(session_id uuid)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from public.communication_participations p
  where p.session_id = $1
    and (
      (p.state = 'reserved' and p.reserved_until > now())
      or (
        p.state in ('joined', 'reconnecting')
        and exists (
          select 1
          from public.communication_user_leases l
          where l.user_id = p.user_id
            and l.participation_id = p.id
            and l.generation = p.generation
            and l.expires_at > now()
        )
      )
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

create or replace function public.communication_confirm_joined_provider_service(
  p_provider_room_name text,
  p_connection_id text,
  p_generation integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  participation_row public.communication_participations;
begin
  select p.* into participation_row
  from public.communication_participations p
  join public.communication_sessions s on s.id = p.session_id
  where s.provider_room_name = p_provider_room_name
    and p.user_id::text = split_part(p_connection_id, ':', 1)
    and p.generation = p_generation
    and p.state in ('reserved', 'reconnecting', 'joined')
  order by p.created_at desc
  limit 1
  for update of p;

  if not found then
    return;
  end if;

  update public.communication_participations
  set state = 'joined',
      joined_at = coalesce(joined_at, now()),
      connection_id = p_connection_id
  where id = participation_row.id;

  update public.communication_user_leases
  set expires_at = now() + interval '45 seconds'
  where user_id = participation_row.user_id
    and participation_id = participation_row.id
    and generation = participation_row.generation;
end;
$$;

create or replace function public.communication_leave_provider_service(
  p_provider_room_name text,
  p_connection_id text,
  p_generation integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  participation_row public.communication_participations;
begin
  select p.* into participation_row
  from public.communication_participations p
  join public.communication_sessions s on s.id = p.session_id
  where s.provider_room_name = p_provider_room_name
    and p.connection_id = p_connection_id
    and p.generation = p_generation
  order by p.created_at desc
  limit 1
  for update of p;

  if not found then
    return;
  end if;

  update public.communication_participations
  set state = 'left',
      left_at = coalesce(left_at, now()),
      leave_reason = coalesce(leave_reason, 'provider_left')
  where id = participation_row.id
    and state in ('reserved', 'joined', 'reconnecting');

  delete from public.communication_user_leases
  where user_id = participation_row.user_id
    and participation_id = participation_row.id
    and generation = participation_row.generation;

  update public.communication_media_leases
  set state = 'released'
  where participation_id = participation_row.id
    and state in ('reserved', 'published');
end;
$$;

create or replace function public.communication_finish_room_provider_service(
  p_provider_room_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  session_row public.communication_sessions;
begin
  select * into session_row
  from public.communication_sessions
  where provider_room_name = p_provider_room_name
  for update;

  if not found then
    return;
  end if;

  update public.communication_participations
  set state = 'left',
      left_at = coalesce(left_at, now()),
      leave_reason = coalesce(leave_reason, 'provider_room_finished')
  where session_id = session_row.id
    and state in ('reserved', 'joined', 'reconnecting');

  delete from public.communication_user_leases l
  using public.communication_participations p
  where l.participation_id = p.id
    and p.session_id = session_row.id;

  update public.communication_media_leases
  set state = 'released'
  where session_id = session_row.id
    and state in ('reserved', 'published');

  update public.communication_sessions
  set state = 'ended',
      ended_at = coalesce(ended_at, now()),
      empty_since = coalesce(empty_since, now()),
      version = case when state = 'ended' then version else version + 1 end
  where id = session_row.id;
end;
$$;

revoke all on function communication.active_occupancy(uuid) from public, anon, authenticated;
revoke all on function communication.expire_pending() from public, anon, authenticated;
revoke all on function public.communication_confirm_joined_provider_service(text, text, integer) from public, anon, authenticated;
revoke all on function public.communication_leave_provider_service(text, text, integer) from public, anon, authenticated;
revoke all on function public.communication_finish_room_provider_service(text) from public, anon, authenticated;

grant execute on function public.communication_confirm_joined_provider_service(text, text, integer) to service_role;
grant execute on function public.communication_leave_provider_service(text, text, integer) to service_role;
grant execute on function public.communication_finish_room_provider_service(text) to service_role;
