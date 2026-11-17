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
  return ((data || []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    kind: String(row.kind),
    referenceId: (row.reference_id as string | null) ?? null,
    payload: (row.payload as Record<string, unknown>) || {},
    readAt: (row.read_at as string | null) ?? null,
    createdAt: String(row.created_at),
  })) satisfies NotificationRecord[];
}

export async function readNotification(client: AnyClient, id: string) {
  return callRpc(client, "communication_read_notification", { p_id: id });
}
