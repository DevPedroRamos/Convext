import { inviteIdFromNotification, isLiveIncomingCall } from "@/lib/communication/incoming-call";
import { callRpc } from "@/lib/communication/rpc";
import { CommunicationError } from "@/lib/communication/errors";
import type { NotificationRecord } from "@/types/communication";

type AnyClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  from: (table: string) => any;
};

export async function listNotifications(client: AnyClient, userId: string) {
  const { data, error } = await client
    .from("communication_notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new CommunicationError("ACTION_DENIED", error.message, true);
  const notifications = ((data || []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    kind: String(row.kind),
    referenceId: (row.reference_id as string | null) ?? null,
    payload: (row.payload as Record<string, unknown>) || {},
    readAt: (row.read_at as string | null) ?? null,
    createdAt: String(row.created_at),
  })) satisfies NotificationRecord[];

  const unreadIncoming = notifications.filter((item) => item.kind === "incoming_call" && !item.readAt);
  if (!unreadIncoming.length) return notifications;

  const inviteIds = unreadIncoming.map(inviteIdFromNotification).filter((id): id is string => Boolean(id));
  const sessionIds = unreadIncoming.map((item) => item.referenceId).filter((id): id is string => Boolean(id));
  type InviteRow = { id: string; session_id: string; state: string; expires_at: string };
  const invites: InviteRow[] = [];
  if (inviteIds.length) {
    const { data: inviteRows } = await client.from("communication_call_invites").select("id, session_id, state, expires_at").in("id", inviteIds);
    invites.push(...((inviteRows || []) as InviteRow[]));
  }
  if (sessionIds.length) {
    const { data: inviteRows } = await client.from("communication_call_invites").select("id, session_id, state, expires_at").in("session_id", sessionIds);
    invites.push(...((inviteRows || []) as InviteRow[]));
  }
  const byId = new Map(invites.map((invite) => [invite.id, invite]));
  const bySession = new Map<string, InviteRow>();
  for (const invite of invites) {
    const current = bySession.get(invite.session_id);
    if (!current || invite.state === "ringing") bySession.set(invite.session_id, invite);
  }
  const now = Date.now();
  const staleIds: string[] = [];
  const mapped = notifications.map((item) => {
    if (item.kind !== "incoming_call" || item.readAt) return item;
    const inviteId = inviteIdFromNotification(item);
    const row = (inviteId ? byId.get(inviteId) : null) ?? (item.referenceId ? bySession.get(item.referenceId) : null) ?? null;
    const invite = row ? { state: row.state, expiresAt: row.expires_at } : null;
    if (isLiveIncomingCall(item, invite, now)) return item;
    staleIds.push(item.id);
    return { ...item, readAt: new Date(now).toISOString() };
  });
  if (staleIds.length) {
    await client.from("communication_notifications").update({ read_at: new Date(now).toISOString() }).in("id", staleIds);
  }
  return mapped;
}

export async function readNotification(client: AnyClient, id: string) {
  return callRpc(client, "communication_read_notification", { p_id: id });
}
