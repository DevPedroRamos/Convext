import type { ConnectionState, MediaSourceState } from "@/types/communication";

export type ConnectionEvent =
  | "open_prejoin"
  | "join"
  | "connected"
  | "disconnect"
  | "reconnect"
  | "fail"
  | "end"
  | "leave";

const transitions: Record<ConnectionState, Partial<Record<ConnectionEvent, ConnectionState>>> = {
  idle: { open_prejoin: "prejoin" },
  prejoin: { join: "joining", leave: "idle" },
  joining: { connected: "connected", fail: "failed", leave: "leaving", end: "ended" },
  connected: { disconnect: "reconnecting", leave: "leaving", end: "ended", fail: "failed" },
  reconnecting: { connected: "connected", fail: "failed", leave: "leaving", end: "ended" },
  failed: { join: "joining", leave: "idle", open_prejoin: "prejoin" },
  ended: { open_prejoin: "prejoin", leave: "idle" },
  leaving: { end: "idle", fail: "idle", connected: "idle" },
};

export function nextConnectionState(current: ConnectionState, event: ConnectionEvent): ConnectionState {
  return transitions[current][event] || current;
}

export function leaveIsIdempotent(current: ConnectionState) {
  return current === "idle" || current === "ended" || current === "leaving";
}

export type LocalSources = {
  microphone: MediaSourceState;
  camera: MediaSourceState;
  screen: MediaSourceState;
};

export function sourcesAfterReconnect(previous: LocalSources): LocalSources {
  return {
    microphone: previous.microphone === "on" ? "on" : "off",
    camera: previous.camera === "on" ? "off" : "off",
    screen: "off",
  };
}

export function shouldRepublish(source: keyof LocalSources, previous: LocalSources) {
  if (source === "camera" || source === "screen") return false;
  return previous[source] === "on";
}

export function navigationKeepsSession(pathname: string) {
  return pathname.startsWith("/app");
}
