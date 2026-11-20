import { describe, expect, it } from "vitest";
import { isOnline, isPresent, presenceLabel, PRESENCE_TTL_MS, shouldShowStatus } from "@/lib/presence";

const now = Date.parse("2026-11-19T23:00:00.000Z");

describe("presença real", () => {
  it("considera presente só com last_seen recente", () => {
    expect(isPresent(new Date(now - 60_000).toISOString(), now)).toBe(true);
    expect(isPresent(new Date(now - PRESENCE_TTL_MS).toISOString(), now)).toBe(false);
    expect(isPresent(null, now)).toBe(false);
    expect(isPresent("invalid", now)).toBe(false);
  });

  it("só fica online com disponível e heartbeat fresco", () => {
    const fresh = new Date(now - 30_000).toISOString();
    expect(isOnline({ available: true, lastSeenAt: fresh }, now)).toBe(true);
    expect(isOnline({ available: false, lastSeenAt: fresh }, now)).toBe(false);
    expect(isOnline({ available: true, lastSeenAt: null }, now)).toBe(false);
  });

  it("esconde status quando está offline", () => {
    const fresh = new Date(now - 10_000).toISOString();
    const stale = new Date(now - PRESENCE_TTL_MS - 1).toISOString();
    expect(shouldShowStatus(fresh, now)).toBe(true);
    expect(shouldShowStatus(stale, now)).toBe(false);
  });

  it("rotula Offline, Ausente e Disponível", () => {
    const fresh = new Date(now - 10_000).toISOString();
    expect(presenceLabel({ available: true, lastSeenAt: fresh }, now)).toBe("Disponível");
    expect(presenceLabel({ available: false, lastSeenAt: fresh }, now)).toBe("Ausente");
    expect(presenceLabel({ available: true, lastSeenAt: null }, now)).toBe("Offline");
  });
});
