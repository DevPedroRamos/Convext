export const PRESENCE_TTL_MS = 5 * 60 * 1000;
export const PRESENCE_HEARTBEAT_MS = 60 * 1000;
export const PRESENCE_POLL_MS = 20 * 1000;

export type PresenceSignals = {
  available: boolean;
  lastSeenAt: string | Date | null | undefined;
};

function seenAt(lastSeenAt: PresenceSignals["lastSeenAt"]) {
  if (!lastSeenAt) return null;
  const value = typeof lastSeenAt === "string" ? Date.parse(lastSeenAt) : lastSeenAt.getTime();
  return Number.isFinite(value) ? value : null;
}

export function isPresent(lastSeenAt: PresenceSignals["lastSeenAt"], now = Date.now()) {
  const value = seenAt(lastSeenAt);
  if (value == null) return false;
  return now - value < PRESENCE_TTL_MS;
}

export function isOnline({ available, lastSeenAt }: PresenceSignals, now = Date.now()) {
  return Boolean(available) && isPresent(lastSeenAt, now);
}

export function shouldShowStatus(lastSeenAt: PresenceSignals["lastSeenAt"], now = Date.now()) {
  return isPresent(lastSeenAt, now);
}

export function presenceLabel({ available, lastSeenAt }: PresenceSignals, now = Date.now()) {
  if (!isPresent(lastSeenAt, now)) return "Offline";
  return available ? "Disponível" : "Ausente";
}
