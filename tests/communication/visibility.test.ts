import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canAccessArea, canAccessPath } from "@/lib/access";
import { canEnterRoom, canSeeRoom } from "@/lib/communication/authorization";
import { unwrapRpc } from "@/lib/communication/rpc";
import { CommunicationError } from "@/lib/communication/errors";
import { getRoom } from "@/lib/communication/rooms";
import { joinSession } from "@/lib/communication/sessions";
import { handleProviderEvent, processOutbox } from "@/lib/communication/reconciliation";

describe("acesso das quatro roles", () => {
  it("todas as roles onboarded entram em Salas e Equipe permanece administrativa", () => {
    for (const role of ["admin", "coordinator", "traffic", "creator"] as const) {
      expect(canAccessArea(role, "salas")).toBe(true);
      expect(canAccessPath(role, "/app/chamadas/abc")).toBe(true);
    }
    expect(canAccessArea("traffic", "equipe")).toBe(false);
    expect(canAccessArea("admin", "equipe")).toBe(true);
  });
});

describe("visibilidade de sala privada", () => {
  it("terceiro onboarded não vê e não entra na sala privada", () => {
    const input = { access: "private" as const, archivedAt: null, isMember: false, hasPendingInvite: false, onboarded: true };
    expect(canSeeRoom(input)).toBe(false);
    expect(canEnterRoom(input)).toBe(false);
  });

  it("membro vê e entra; convidado pendente vê e não entra", () => {
    expect(canSeeRoom({ access: "private", archivedAt: null, isMember: true, hasPendingInvite: false, onboarded: true })).toBe(true);
    expect(canEnterRoom({ access: "private", archivedAt: null, isMember: true, hasPendingInvite: false, onboarded: true })).toBe(true);
    expect(canSeeRoom({ access: "private", archivedAt: null, isMember: false, hasPendingInvite: true, onboarded: true })).toBe(true);
    expect(canEnterRoom({ access: "private", archivedAt: null, isMember: false, hasPendingInvite: true, onboarded: true })).toBe(false);
  });
});

describe("contratos RPC e HTTP", () => {
  it("recusa idempotência com outro corpo", () => {
    expect(() => unwrapRpc({ ok: false, code: "VERSION_CONFLICT", message: "Idempotency-Key reutilizada com outro corpo." })).toThrow(CommunicationError);
  });

  it("sala ausente vira 404 sem vazar metadados", async () => {
    const client = {
      rpc: async () => ({ data: null, error: null }),
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    };
    await expect(getRoom(client as never, "user-1", "11111111-1111-1111-1111-111111111111")).rejects.toMatchObject({ code: "ROOM_UNAVAILABLE" });
  });

  it("join sem LiveKit responde mídia indisponível", async () => {
    const client = {
      rpc: async () => ({
        data: {
          ok: true,
          data: {
            sessionId: "s1",
            participationId: "p1",
            generation: 1,
            providerRoomName: "room-1",
            kind: "room",
            roomId: "r1",
            capabilities: { microphone: true, camera: true, screen: true },
          },
        },
        error: null,
      }),
      from: () => ({}),
    };
    delete process.env.LIVEKIT_URL;
    delete process.env.LIVEKIT_API_KEY;
    delete process.env.LIVEKIT_API_SECRET;
    await expect(joinSession(client as never, "user-1", { roomId: "r1", deviceSessionId: "device-session-1" })).rejects.toMatchObject({
      code: "MEDIA_UNAVAILABLE",
    });
  });

  it("webhook duplicado não reabre encontro", async () => {
    const admin = {
      rpc: async () => ({ data: { ok: true, data: { duplicate: true } }, error: null }),
      from: () => ({}),
    };
    await expect(handleProviderEvent(admin as never, { id: "evt-1", event: "room_finished" })).resolves.toEqual({ duplicate: true });
  });

  it("webhook de saída encerra somente a geração vinculada à sala do provedor", async () => {
    const calls: { fn: string; args?: Record<string, unknown> }[] = [];
    const admin = {
      rpc: async (fn: string, args?: Record<string, unknown>) => {
        calls.push({ fn, args });
        if (fn === "communication_record_provider_event") {
          return { data: { ok: true, data: { duplicate: false } }, error: null };
        }
        return { data: { ok: true }, error: null };
      },
      from: () => ({}),
    };

    await handleProviderEvent(admin as never, {
      id: "evt-left",
      event: "participant_left",
      room: { name: "room-provider-1" },
      participant: { identity: "user-1:3" },
    });

    expect(calls).toContainEqual({
      fn: "communication_leave_provider_service",
      args: {
        p_provider_room_name: "room-provider-1",
        p_connection_id: "user-1:3",
        p_generation: 3,
      },
    });
  });

  it("outbox permanece pendente quando o provedor não está configurado", async () => {
    const updates: unknown[] = [];
    const admin = {
      rpc: async () => ({ data: { ok: true }, error: null }),
      from: () => ({
        select: () => ({
          eq: () => ({
            lte: () => ({
              limit: async () => ({ data: [{ id: "1", operation: "end_provider_room", target_id: "room", payload: {}, attempts: 0 }] }),
            }),
          }),
        }),
        update: (value: unknown) => ({
          eq: async () => {
            updates.push(value);
            return { data: null, error: null };
          },
        }),
      }),
    };
    delete process.env.LIVEKIT_URL;
    await processOutbox(admin as never);
    expect(updates.some((item) => item && typeof item === "object" && (item as { last_error?: string }).last_error === "MEDIA_UNAVAILABLE")).toBe(true);
  });
});

describe("schema", () => {
  it("a migration declara tabelas, RLS e o tick de reconciliação", () => {
    const sql = readFileSync("supabase/migrations/20261117030325_communication.sql", "utf8");
    for (const table of [
      "communication_rooms",
      "communication_user_leases",
      "communication_outbox",
      "communication_idempotency",
    ]) {
      expect(sql).toContain(table);
    }
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("communication_tick");
    expect(sql).toContain("cron.schedule");
  });

  it("expira presença sem lease e reconcilia saída do provedor por geração", () => {
    const sql = readFileSync("supabase/migrations/20261118192700_fix_audio_room_presence.sql", "utf8");
    expect(sql).toContain("leave_reason = 'lease_expired'");
    expect(sql).toContain("l.expires_at > now()");
    expect(sql).toContain("communication_leave_provider_service");
    expect(sql).toContain("p.connection_id = p_connection_id");
    expect(sql).toContain("p.generation = p_generation");
  });
});
