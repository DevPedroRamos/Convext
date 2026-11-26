import type { NotificationRecord } from "@/types/communication";

export type CallInviteSnapshot = { state: string; expiresAt: string };

export function inviteIdFromNotification(notification: Pick<NotificationRecord, "payload">) {
  const value = notification.payload.inviteId;
  return typeof value === "string" && value ? value : null;
}

/** Notificação de chamada que ainda deve abrir o overlay. */
export function isLiveIncomingCall(
  notification: Pick<NotificationRecord, "kind" | "readAt">,
  invite: CallInviteSnapshot | null,
  nowMs = Date.now(),
) {
  if (notification.kind !== "incoming_call" || notification.readAt) return false;
  if (!invite) return false;
  return invite.state === "ringing" && Date.parse(invite.expiresAt) > nowMs;
}
