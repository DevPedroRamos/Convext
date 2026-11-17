import { callRpc } from "@/lib/communication/rpc";

type AnyClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export async function createCall(client: AnyClient, inviteeIds: string[]) {
  return callRpc<{ session: Record<string, unknown>; inviteIds: string[] }>(client, "communication_create_call", {
    p_invitee_ids: inviteeIds,
  });
}

export async function inviteToCall(client: AnyClient, sessionId: string, inviteeIds: string[]) {
  return callRpc(client, "communication_invite_to_call", { p_session_id: sessionId, p_invitee_ids: inviteeIds });
}

export async function respondCallInvite(client: AnyClient, inviteId: string, accept: boolean) {
  return callRpc(client, "communication_respond_call_invite", { p_invite_id: inviteId, p_accept: accept });
}

export async function cancelCall(client: AnyClient, sessionId: string) {
  return callRpc(client, "communication_cancel_call", { p_session_id: sessionId });
}
