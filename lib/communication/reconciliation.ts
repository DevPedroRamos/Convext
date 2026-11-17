import { endProviderRoom, mutePublishedTrack, removeProviderParticipant } from "@/lib/communication/livekit";
import { hasLiveKitConfig } from "@/lib/communication/config";

type AdminClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  from: (table: string) => any;
};

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
        await removeProviderParticipant(String(row.target_id), `${payload.userId}`);
      } else if (row.operation === "end_provider_room") {
        await endProviderRoom(String(row.target_id));
      } else if (row.operation === "mute_published_track" && payload.userId) {
        await mutePublishedTrack(String(row.target_id), String(payload.userId), String(payload.source || "microphone"));
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
  const recorded = await admin.rpc("communication_record_provider_event", { p_event_id: eventId, p_type: event.event || "unknown" });
  const envelope = recorded.data as { ok?: boolean; data?: { duplicate?: boolean } } | null;
  if (envelope?.data?.duplicate) return { duplicate: true };
  const identity = event.participant?.identity || "";
  const [userId, generation] = identity.split(":");
  if (event.event === "participant_joined" && userId && generation) {
    const { data } = await admin.from("communication_participations").select("id").eq("user_id", userId).eq("generation", Number(generation)).order("created_at", { ascending: false }).limit(1);
    const participation = ((data || []) as { id: string }[])[0];
    if (participation) {
      await admin.rpc("communication_confirm_joined_service", {
        p_participation_id: participation.id,
        p_generation: Number(generation),
        p_connection_id: identity,
      });
    }
  }
  await admin.rpc("communication_finish_provider_event", { p_event_id: eventId, p_outcome: "ok" });
  return { duplicate: false };
}
