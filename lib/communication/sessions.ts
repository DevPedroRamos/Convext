import { createMediaToken, updateParticipantSources } from "@/lib/communication/livekit";
import { callRpc } from "@/lib/communication/rpc";
import { CommunicationError } from "@/lib/communication/errors";
import type { JoinResult } from "@/types/communication";

type AnyClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  // Supabase's fluent query builder is intentionally structural at this adapter boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

type JoinRpc = {
  sessionId: string;
  participationId: string;
  generation: number;
  providerRoomName: string;
  kind: "room" | "direct";
  roomId: string | null;
  capabilities: { microphone: boolean; camera: boolean; screen: boolean };
};

async function tokenFor(join: JoinRpc, userId: string, extra: Array<"microphone" | "camera" | "screen"> = ["microphone"]) {
  const media = await createMediaToken({
    identity: `${userId}:${join.generation}`,
    roomName: join.providerRoomName,
    canPublish: extra.length > 0,
    sources: extra,
  });
  return {
    ...media,
    sessionId: join.sessionId,
    participationId: join.participationId,
    generation: join.generation,
    providerRoomName: join.providerRoomName,
    kind: join.kind,
    roomId: join.roomId,
    capabilities: join.capabilities,
  } satisfies JoinResult;
}

export async function joinSession(
  client: AnyClient,
  userId: string,
  input: { roomId?: string; sessionId?: string; deviceSessionId: string; takeover?: boolean; microphone?: boolean; camera?: boolean },
): Promise<JoinResult> {
  const join = await callRpc<JoinRpc>(client, input.takeover ? "communication_takeover" : "communication_join", input.takeover
    ? { p_room_id: input.roomId ?? null, p_session_id: input.sessionId ?? null, p_device_session_id: input.deviceSessionId }
    : { p_room_id: input.roomId ?? null, p_session_id: input.sessionId ?? null, p_device_session_id: input.deviceSessionId, p_takeover: false });
  const sources: Array<"microphone" | "camera"> = [];
  if (join.capabilities.microphone) sources.push("microphone");
  if (input.camera && join.capabilities.camera) sources.push("camera");
  return tokenFor(join, userId, sources);
}

export async function markJoined(client: AnyClient, participationId: string, generation: number, connectionId: string) {
  return callRpc(client, "communication_mark_joined", {
    p_participation_id: participationId,
    p_generation: generation,
    p_connection_id: connectionId,
  });
}

export async function leaveSession(client: AnyClient, sessionId: string, participationId: string, generation: number) {
  return callRpc(client, "communication_leave", {
    p_session_id: sessionId,
    p_participation_id: participationId,
    p_generation: generation,
  });
}

export async function renewSession(client: AnyClient, userId: string, sessionId: string, participationId: string, generation: number) {
  const join = await callRpc<JoinRpc>(client, "communication_renew", {
    p_session_id: sessionId,
    p_participation_id: participationId,
    p_generation: generation,
  });
  return tokenFor({ ...join, capabilities: join.capabilities || { microphone: true, camera: true, screen: true }, kind: join.kind || "room", roomId: join.roomId ?? null }, userId);
}

export async function reservePublication(client: AnyClient, userId: string, sessionId: string, participationId: string, source: "camera" | "screen") {
  const lease = await callRpc<Record<string, unknown>>(client, "communication_reserve_publication", {
    p_session_id: sessionId,
    p_participation_id: participationId,
    p_source: source,
  });
  const session = await client.from("communication_sessions").select("provider_room_name").eq("id", sessionId).maybeSingle();
  const roomName = String((session.data as { provider_room_name?: string } | null)?.provider_room_name || "");
  if (!roomName) throw new CommunicationError("ROOM_UNAVAILABLE", "Sessão indisponível.");
  const generationRow = await client.from("communication_participations").select("generation").eq("id", participationId).maybeSingle();
  const generation = Number((generationRow.data as { generation?: number } | null)?.generation || 1);
  const sources: Array<"microphone" | "camera" | "screen"> = source === "screen"
    ? ["microphone", "camera", "screen"]
    : ["microphone", "camera"];
  const identity = `${userId}:${generation}`;
  await updateParticipantSources(roomName, identity, sources);
  const media = await createMediaToken({
    identity,
    roomName,
    canPublish: true,
    sources,
  });
  return { lease, ...media };
}

export async function releasePublication(client: AnyClient, sessionId: string, participationId: string, source: "camera" | "screen") {
  return callRpc(client, "communication_release_publication", {
    p_session_id: sessionId,
    p_participation_id: participationId,
    p_source: source,
  });
}

export async function publishOk(client: AnyClient, leaseId: string) {
  return callRpc(client, "communication_publish_ok", { p_lease_id: leaseId });
}

export async function moderateSession(client: AnyClient, sessionId: string, targetUserId: string, action: string, source?: string) {
  return callRpc(client, "communication_moderate", {
    p_session_id: sessionId,
    p_target_user_id: targetUserId,
    p_action: action,
    p_source: source ?? null,
  });
}

export async function endSession(client: AnyClient, sessionId: string, expectedVersion: number) {
  return callRpc(client, "communication_end_session", { p_session_id: sessionId, p_expected_version: expectedVersion });
}

export async function getSession(client: AnyClient, sessionId: string) {
  const { data, error } = await client.from("communication_sessions").select("*").eq("id", sessionId).maybeSingle();
  if (error) throw new CommunicationError("ACTION_DENIED", error.message, true);
  if (!data) throw new CommunicationError("ROOM_UNAVAILABLE", "Sessão indisponível.");
  return data as Record<string, unknown>;
}
