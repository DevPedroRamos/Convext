import { endProviderRoom, mutePublishedTrack, removeProviderParticipant } from "@/lib/communication/livekit";
import { hasLiveKitConfig } from "@/lib/communication/config";

type AdminClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  // Supabase's fluent query builder is intentionally structural at this adapter boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

async function providerIdentity(admin: AdminClient, payload: Record<string, unknown>) {
  const userId = String(payload.userId || "");
  const sessionId = String(payload.sessionId || "");
  if (!userId || !sessionId) throw new Error("PARTICIPANT_IDENTITY_MISSING");
  const { data, error } = await admin
    .from("communication_participations")
    .select("connection_id")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const connectionId = ((data || []) as { connection_id?: string }[])[0]?.connection_id;
  if (!connectionId?.includes(":")) throw new Error("PARTICIPANT_IDENTITY_MISSING");
  return connectionId;
}

async function rpcOrThrow(admin: AdminClient, fn: string, args: Record<string, unknown>) {
  const result = await admin.rpc(fn, args);
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function processOutbox(admin: AdminClient) {
  const { data } = await admin
    .from("communication_outbox")
    .select("*")
    .eq("state", "pending")
    .lte("next_attempt_at", new Date().toISOString())
    .limit(25);
  const rows = (data || []) as Record<string, unknown>[];
  for (const row of rows) {
    await admin.from("communication_outbox").update({ state: "processing", attempts: Number(row.attempts || 0) + 1 }).eq("id", row.id);
    try {
      if (!hasLiveKitConfig()) {
        await admin.from("communication_outbox").update({
          state: "pending",
          last_error: "MEDIA_UNAVAILABLE",
          next_attempt_at: new Date(Date.now() + 30_000).toISOString(),
        }).eq("id", row.id);
        continue;
      }
      const payload = (row.payload || {}) as Record<string, unknown>;
      if (row.operation === "remove_participant" && payload.userId) {
        await removeProviderParticipant(String(row.target_id), await providerIdentity(admin, payload));
      } else if (row.operation === "end_provider_room") {
        await endProviderRoom(String(row.target_id));
      } else if (row.operation === "mute_published_track" && payload.userId) {
        await mutePublishedTrack(
          String(row.target_id),
          await providerIdentity(admin, payload),
          String(payload.source || "microphone"),
        );
      }
      await admin.from("communication_outbox").update({ state: "done" }).eq("id", row.id);
    } catch (error) {
      await admin.from("communication_outbox").update({
        state: "pending",
        last_error: error instanceof Error ? error.message : "fail",
        next_attempt_at: new Date(Date.now() + 15_000).toISOString(),
      }).eq("id", row.id);
    }
  }
}

export async function reconcile(admin: AdminClient) {
  await admin.rpc("communication_tick");
  await processOutbox(admin);
}

export async function handleProviderEvent(admin: AdminClient, event: { id?: string; event?: string; room?: { name?: string }; participant?: { identity?: string } }) {
  const eventId = event.id || `${event.event}-${event.participant?.identity || ""}-${Date.now()}`;
  const recorded = await rpcOrThrow(admin, "communication_record_provider_event", {
    p_event_id: eventId,
    p_type: event.event || "unknown",
  });
  const envelope = recorded as { ok?: boolean; data?: { duplicate?: boolean } } | null;
  if (envelope?.data?.duplicate) return { duplicate: true };
  const identity = event.participant?.identity || "";
  const separator = identity.lastIndexOf(":");
  const generation = Number(identity.slice(separator + 1));
  const roomName = event.room?.name || "";
  if (event.event === "participant_joined" && separator > 0 && Number.isInteger(generation) && roomName) {
    await rpcOrThrow(admin, "communication_confirm_joined_provider_service", {
      p_provider_room_name: roomName,
      p_connection_id: identity,
      p_generation: generation,
    });
  } else if (event.event === "participant_left" && separator > 0 && Number.isInteger(generation) && roomName) {
    await rpcOrThrow(admin, "communication_leave_provider_service", {
      p_provider_room_name: roomName,
      p_connection_id: identity,
      p_generation: generation,
    });
  } else if (event.event === "room_finished" && roomName) {
    await rpcOrThrow(admin, "communication_finish_room_provider_service", {
      p_provider_room_name: roomName,
    });
  }
  await rpcOrThrow(admin, "communication_finish_provider_event", { p_event_id: eventId, p_outcome: "ok" });
  return { duplicate: false };
}
