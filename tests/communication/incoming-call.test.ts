import { describe, expect, it } from "vitest";
import { isLiveIncomingCall } from "@/lib/communication/incoming-call";

const unread = { kind: "incoming_call", readAt: null };
const now = Date.parse("2026-11-26T14:00:00.000Z");

describe("chamada de entrada viva", () => {
  it("só abre overlay se o convite ainda está ringing e não expirou", () => {
    expect(isLiveIncomingCall(unread, { state: "ringing", expiresAt: "2026-11-26T14:00:30.000Z" }, now)).toBe(true);
    expect(isLiveIncomingCall(unread, { state: "expired", expiresAt: "2026-11-26T14:00:30.000Z" }, now)).toBe(false);
    expect(isLiveIncomingCall(unread, { state: "ringing", expiresAt: "2026-11-26T13:59:59.000Z" }, now)).toBe(false);
    expect(isLiveIncomingCall(unread, null, now)).toBe(false);
    expect(isLiveIncomingCall({ kind: "incoming_call", readAt: "2026-11-26T13:59:00.000Z" }, { state: "ringing", expiresAt: "2026-11-26T14:00:30.000Z" }, now)).toBe(false);
  });
});
