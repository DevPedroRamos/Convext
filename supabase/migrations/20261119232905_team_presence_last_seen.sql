alter table public.profiles
  add column if not exists last_seen_at timestamptz;

grant update (available, status_id, last_seen_at) on public.profiles to authenticated;

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
      'lastSeenAt', p.last_seen_at,
      'inCall', exists (
        select 1 from public.communication_user_leases l where l.user_id = p.id and l.expires_at > now()
      )
    ) order by p.first_name)
    from public.profiles p
    left join public.employee_records er on er.user_id = p.id
    where p.onboarding_completed = true
      and p.id <> actor
      and p.role in ('admin', 'coordinator', 'traffic', 'creator', 'commercial')
      and (p.role = 'admin' or er.employment_status = 'active')
  ), '[]'::jsonb));
end;
$$;
