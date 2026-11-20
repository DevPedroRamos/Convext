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
declare
  p_operation_id text := operation_id;
  p_operation text := operation;
  p_target_id text := target_id;
  p_payload jsonb := payload;
begin
  insert into public.communication_outbox (operation_id, operation, target_id, payload)
  values (
    p_operation_id,
    p_operation,
    p_target_id,
    p_payload
  )
  on conflict on constraint communication_outbox_operation_id_key do nothing;
end;
$$;
