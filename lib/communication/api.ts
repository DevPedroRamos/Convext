import type { DirectoryPerson, JoinResult, NotificationRecord, RoomRecord } from "@/types/communication";

function deviceSessionId() {
  if (typeof window === "undefined") return "server";
  const key = "convext:device-session";
  const current = sessionStorage.getItem(key);
  if (current) return current;
  const next = crypto.randomUUID();
  sessionStorage.setItem(key, next);
  return next;
}

async function request<T>(path: string, init: RequestInit & { idempotent?: boolean } = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (init.idempotent) headers.set("Idempotency-Key", crypto.randomUUID());
  const response = await fetch(path, { ...init, headers, credentials: "same-origin" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Falha na comunicação") as Error & { code?: string };
    error.code = data.code;
    throw error;
  }
  return data as T;
}

export const communicationApi = {
  deviceSessionId,
  rooms: (q = "") => request<{ rooms: RoomRecord[] }>(`/api/communication/rooms?q=${encodeURIComponent(q)}`),
  room: (id: string) => request<{ room: RoomRecord }>(`/api/communication/rooms/${id}`),
  createRoom: (body: unknown) => request<{ room: RoomRecord }>("/api/communication/rooms", { method: "POST", body: JSON.stringify(body), idempotent: true }),
  people: () => request<{ people: DirectoryPerson[] }>("/api/communication/people"),
  invites: () => request<{ invites: { id: string; roomId: string; name: string; from: string; expiresAt: string }[] }>("/api/communication/invites"),
  respondRoomInvite: (id: string, action: "accept" | "decline") =>
    request(`/api/communication/room-invites/${id}/respond`, { method: "POST", body: JSON.stringify({ action }), idempotent: true }),
  call: (inviteeIds: string[]) =>
    request<{ session: { id: string } }>("/api/communication/calls", { method: "POST", body: JSON.stringify({ inviteeIds }), idempotent: true }),
  respondCall: (id: string, action: "accept" | "decline") =>
    request(`/api/communication/call-invites/${id}/respond`, { method: "POST", body: JSON.stringify({ action }), idempotent: true }),
  cancelCall: (id: string) => request(`/api/communication/calls/${id}/cancel`, { method: "POST", body: "{}" }),
  join: (body: { roomId?: string; sessionId?: string; takeover?: boolean; microphone?: boolean; camera?: boolean }) =>
    request<JoinResult>("/api/communication/join", {
      method: "POST",
      body: JSON.stringify({ ...body, deviceSessionId: deviceSessionId(), operationId: crypto.randomUUID() }),
      idempotent: true,
    }),
  takeover: (sessionId: string, roomId?: string) =>
    request<JoinResult>(`/api/communication/sessions/${sessionId}/takeover`, {
      method: "POST",
      body: JSON.stringify({ sessionId, roomId, deviceSessionId: deviceSessionId() }),
      idempotent: true,
    }),
  leave: (sessionId: string, participationId: string, generation: number) =>
    request(`/api/communication/sessions/${sessionId}/leave`, { method: "POST", body: JSON.stringify({ participationId, generation }) }),
  joined: (sessionId: string, participationId: string, generation: number, connectionId: string) =>
    request(`/api/communication/sessions/${sessionId}/joined`, { method: "POST", body: JSON.stringify({ participationId, generation, connectionId }) }),
  reserve: (sessionId: string, participationId: string, generation: number, source: "camera" | "screen") =>
    request<{ token: string; serverUrl: string; lease: { id: string } }>(`/api/communication/sessions/${sessionId}/publications/${source}`, {
      method: "POST",
      body: JSON.stringify({ participationId, generation }),
    }),
  release: (sessionId: string, participationId: string, generation: number, source: "camera" | "screen") =>
    request(`/api/communication/sessions/${sessionId}/publications/${source}`, { method: "DELETE", body: JSON.stringify({ participationId, generation }) }),
  moderate: (sessionId: string, body: unknown) =>
    request(`/api/communication/sessions/${sessionId}/moderation`, { method: "POST", body: JSON.stringify(body) }),
  end: (sessionId: string, expectedVersion: number) =>
    request(`/api/communication/sessions/${sessionId}/end`, { method: "POST", body: JSON.stringify({ expectedVersion }) }),
  notifications: () => request<{ notifications: NotificationRecord[] }>("/api/communication/notifications"),
  readNotification: (id: string) => request(`/api/communication/notifications/${id}/read`, { method: "POST", body: "{}" }),
};
