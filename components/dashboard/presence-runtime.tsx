"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { PRESENCE_HEARTBEAT_MS, PRESENCE_POLL_MS, type PresenceSignals } from "@/lib/presence";
import type { PresenceSnapshotMember } from "@/lib/team-status";

type PresenceContextValue = {
  selfId: string | null;
  selfLastSeenAt: string | null;
  members: Record<string, PresenceSnapshotMember>;
};

const PresenceContext = createContext<PresenceContextValue>({
  selfId: null,
  selfLastSeenAt: null,
  members: {},
});

const TAB_CHANNEL = "convext-presence-tabs";

function toMap(members: PresenceSnapshotMember[]) {
  return Object.fromEntries(members.map((member) => [member.id, member]));
}

export function usePresenceSignals(id: string | null | undefined, fallback: PresenceSignals): PresenceSignals {
  const { selfId, selfLastSeenAt, members } = useContext(PresenceContext);
  const member = id ? members[id] : undefined;
  const lastSeenAt = id && id === selfId ? selfLastSeenAt ?? member?.lastSeenAt ?? fallback.lastSeenAt : member?.lastSeenAt ?? fallback.lastSeenAt;
  return {
    available: member?.available ?? fallback.available,
    lastSeenAt,
  };
}

export function useSelfPresence(fallback: PresenceSignals): PresenceSignals {
  const { selfId, selfLastSeenAt, members } = useContext(PresenceContext);
  const member = selfId ? members[selfId] : undefined;
  return {
    available: member?.available ?? fallback.available,
    lastSeenAt: selfLastSeenAt ?? member?.lastSeenAt ?? fallback.lastSeenAt,
  };
}

export function PresenceRuntime({
  selfId,
  lastSeenAt,
  children,
}: {
  selfId: string;
  lastSeenAt: string | null;
  children: React.ReactNode;
}) {
  const [members, setMembers] = useState<Record<string, PresenceSnapshotMember>>({});
  const [selfLastSeenAt, setSelfLastSeenAt] = useState<string | null>(lastSeenAt ?? new Date().toISOString());
  const tabId = useRef(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `tab-${Math.random()}`);
  const peerTabs = useRef(new Set<string>());

  const heartbeat = useCallback(async (leaving = false) => {
    const response = await fetch(leaving ? "/api/me/heartbeat?leaving=1" : "/api/me/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaving }),
      keepalive: leaving,
    });
    if (!response.ok) return;
    const payload = (await response.json().catch(() => null)) as { lastSeenAt?: string | null } | null;
    setSelfLastSeenAt(payload?.lastSeenAt ?? (leaving ? null : new Date().toISOString()));
  }, []);

  const poll = useCallback(async () => {
    const response = await fetch("/api/presence/team");
    if (!response.ok) return;
    const payload = (await response.json().catch(() => null)) as { members?: PresenceSnapshotMember[] } | null;
    if (payload?.members) setMembers(toMap(payload.members));
  }, []);

  useEffect(() => {
    void heartbeat();
    void poll();
    const beat = window.setInterval(() => void heartbeat(), PRESENCE_HEARTBEAT_MS);
    const refresh = window.setInterval(() => void poll(), PRESENCE_POLL_MS);
    return () => {
      window.clearInterval(beat);
      window.clearInterval(refresh);
    };
  }, [heartbeat, poll]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(TAB_CHANNEL);
    const id = tabId.current;
    channel.onmessage = (event: MessageEvent<{ type?: string; id?: string }>) => {
      const message = event.data;
      if (!message?.id || message.id === id) return;
      if (message.type === "hello" || message.type === "ack") peerTabs.current.add(message.id);
      if (message.type === "hello") channel.postMessage({ type: "ack", id });
      if (message.type === "bye") peerTabs.current.delete(message.id);
    };
    channel.postMessage({ type: "hello", id });

    function leave() {
      channel.postMessage({ type: "bye", id });
      if (peerTabs.current.size > 0) return;
      const blob = new Blob([JSON.stringify({ leaving: true })], { type: "application/json" });
      if (!navigator.sendBeacon("/api/me/heartbeat?leaving=1", blob)) {
        void heartbeat(true);
      } else {
        setSelfLastSeenAt(null);
      }
    }

    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      channel.postMessage({ type: "bye", id });
      channel.close();
    };
  }, [heartbeat]);

  const value = useMemo(
    () => ({ selfId, selfLastSeenAt, members }),
    [selfId, selfLastSeenAt, members],
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}
