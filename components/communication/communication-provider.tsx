"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Track, type LocalTrack, type RemoteTrack, type Room as LiveKitRoom } from "livekit-client";
import { toast } from "sonner";
import { communicationApi } from "@/lib/communication/api";
import { leaveIsIdempotent, nextConnectionState, sourcesAfterReconnect, type LocalSources } from "@/lib/communication/client-machine";
import type { ConnectionState, JoinResult, NotificationRecord } from "@/types/communication";

type ParticipantView = {
  identity: string;
  name: string;
  speaking: boolean;
  micOn: boolean;
  cameraTrack?: RemoteTrack | LocalTrack | null;
  screenTrack?: RemoteTrack | LocalTrack | null;
  screenAudio?: RemoteTrack | LocalTrack | null;
  isLocal?: boolean;
};

type CommunicationValue = {
  state: ConnectionState;
  join: JoinResult | null;
  title: string;
  startedAt: number | null;
  microphone: boolean;
  camera: boolean;
  presenting: boolean;
  presentationAudio: boolean;
  remoteAudioBlocked: boolean;
  participants: ParticipantView[];
  incoming: NotificationRecord | null;
  connect: (input: { roomId?: string; sessionId?: string; title: string; listenOnly?: boolean; takeover?: boolean }) => Promise<void>;
  leave: () => Promise<void>;
  setMicrophone: (on: boolean) => Promise<void>;
  setCamera: (on: boolean) => Promise<void>;
  startPresentation: () => Promise<void>;
  stopPresentation: () => Promise<void>;
  enableRemoteAudio: () => Promise<void>;
  respondIncoming: (action: "accept" | "decline") => Promise<void>;
};

const CommunicationContext = createContext<CommunicationValue | null>(null);

export function useCommunication() {
  const value = useContext(CommunicationContext);
  if (!value) throw new Error("CommunicationProvider ausente.");
  return value;
}

export function CommunicationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const roomRef = useRef<LiveKitRoom | null>(null);
  const joinRef = useRef<JoinResult | null>(null);
  const sourcesRef = useRef<LocalSources>({ microphone: "off", camera: "off", screen: "off" });
  const [state, setState] = useState<ConnectionState>("idle");
  const [join, setJoin] = useState<JoinResult | null>(null);
  const [title, setTitle] = useState("Sala");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [microphone, setMic] = useState(false);
  const [camera, setCam] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [presentationAudio, setPresentationAudio] = useState(false);
  const [remoteAudioBlocked, setRemoteAudioBlocked] = useState(false);
  const [participants, setParticipants] = useState<ParticipantView[]>([]);
  const [incoming, setIncoming] = useState<NotificationRecord | null>(null);

  const syncParticipants = useCallback(() => {
    const room = roomRef.current;
    if (!room) {
      setParticipants([]);
      return;
    }
    const views: ParticipantView[] = [];
    const local = room.localParticipant;
    views.push({
      identity: local.identity,
      name: "Você",
      speaking: local.isSpeaking,
      micOn: local.isMicrophoneEnabled,
      cameraTrack: local.getTrackPublication(Track.Source.Camera)?.track,
      screenTrack: local.getTrackPublication(Track.Source.ScreenShare)?.track,
      screenAudio: local.getTrackPublication(Track.Source.ScreenShareAudio)?.track,
      isLocal: true,
    });
    room.remoteParticipants.forEach((participant) => {
      views.push({
        identity: participant.identity,
        name: participant.name || participant.identity.split(":")[0],
        speaking: participant.isSpeaking,
        micOn: participant.isMicrophoneEnabled,
        cameraTrack: participant.getTrackPublication(Track.Source.Camera)?.track,
        screenTrack: participant.getTrackPublication(Track.Source.ScreenShare)?.track,
        screenAudio: participant.getTrackPublication(Track.Source.ScreenShareAudio)?.track,
      });
    });
    setParticipants(views);
    setPresentationAudio(views.some((item) => Boolean(item.screenAudio)));
  }, []);

  const cleanupRoom = useCallback(async () => {
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      try {
        await room.disconnect(true);
      } catch {
        // already gone
      }
    }
  }, []);

  const leave = useCallback(async () => {
    const current = joinRef.current;
    setState((value) => (leaveIsIdempotent(value) ? "idle" : nextConnectionState(value, "leave")));
    await cleanupRoom();
    if (current) {
      await communicationApi.leave(current.sessionId, current.participationId, current.generation).catch(() => undefined);
    }
    joinRef.current = null;
    setJoin(null);
    sessionStorage.removeItem("convext:last-join");
    setMic(false);
    setCam(false);
    setPresenting(false);
    setStartedAt(null);
    setParticipants([]);
    setState("idle");
    document.documentElement.style.setProperty("--call-dock-offset", "0px");
  }, [cleanupRoom]);

  const connect = useCallback(async (input: { roomId?: string; sessionId?: string; title: string; listenOnly?: boolean; takeover?: boolean }) => {
    setTitle(input.title);
    setState("joining");
    try {
      const result = input.takeover && input.sessionId
        ? await communicationApi.takeover(input.sessionId, input.roomId)
        : await communicationApi.join({ roomId: input.roomId, sessionId: input.sessionId });
      joinRef.current = result;
      setJoin(result);
      sessionStorage.setItem("convext:last-join", JSON.stringify(result));
      const { Room, RoomEvent, Track } = await import("livekit-client");
      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;
      room.on(RoomEvent.ParticipantConnected, syncParticipants);
      room.on(RoomEvent.ParticipantDisconnected, syncParticipants);
      room.on(RoomEvent.TrackSubscribed, syncParticipants);
      room.on(RoomEvent.TrackUnsubscribed, syncParticipants);
      room.on(RoomEvent.ActiveSpeakersChanged, syncParticipants);
      room.on(RoomEvent.Disconnected, () => setState((value) => nextConnectionState(value, "disconnect")));
      room.on(RoomEvent.Reconnecting, () => {
        sourcesRef.current = sourcesAfterReconnect(sourcesRef.current);
        setCam(false);
        setPresenting(false);
        setState("reconnecting");
      });
      room.on(RoomEvent.Reconnected, () => setState("connected"));
      await room.connect(result.serverUrl, result.token);
      await communicationApi.joined(result.sessionId, result.participationId, result.generation, room.localParticipant.identity);
      if (!input.listenOnly && result.capabilities.microphone) {
        await room.localParticipant.setMicrophoneEnabled(false);
      }
      setStartedAt(Date.now());
      setState("connected");
      syncParticipants();
      try {
        await room.startAudio();
        setRemoteAudioBlocked(false);
      } catch {
        setRemoteAudioBlocked(true);
      }
    } catch (error) {
      setState("failed");
      const code = (error as { code?: string }).code;
      if (code === "SESSION_CONFLICT") {
        toast.error("Você já está em outra sessão.", { description: "Confirme para sair e entrar nesta." });
      } else if (code === "MEDIA_UNAVAILABLE") {
        toast.error("O serviço de mídia não está disponível.");
      } else {
        toast.error(error instanceof Error ? error.message : "Não foi possível entrar.");
      }
      throw error;
    }
  }, [syncParticipants]);

  const setMicrophone = useCallback(async (on: boolean) => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setMicrophoneEnabled(on);
    setMic(on);
    sourcesRef.current = { ...sourcesRef.current, microphone: on ? "on" : "off" };
  }, []);

  const setCamera = useCallback(async (on: boolean) => {
    const room = roomRef.current;
    const current = joinRef.current;
    if (!room || !current) return;
    if (on) {
      const reserved = await communicationApi.reserve(current.sessionId, current.participationId, current.generation, "camera");
      void reserved;
      await room.localParticipant.setCameraEnabled(true);
      setCam(true);
      sourcesRef.current = { ...sourcesRef.current, camera: "on" };
    } else {
      await room.localParticipant.setCameraEnabled(false);
      await communicationApi.release(current.sessionId, current.participationId, current.generation, "camera");
      setCam(false);
      sourcesRef.current = { ...sourcesRef.current, camera: "off" };
    }
  }, []);

  const stopPresentation = useCallback(async () => {
    const room = roomRef.current;
    const current = joinRef.current;
    if (room) await room.localParticipant.setScreenShareEnabled(false);
    if (current) await communicationApi.release(current.sessionId, current.participationId, current.generation, "screen").catch(() => undefined);
    setPresenting(false);
    sourcesRef.current = { ...sourcesRef.current, screen: "off" };
  }, []);

  const startPresentation = useCallback(async () => {
    const room = roomRef.current;
    const current = joinRef.current;
    if (!room || !current) return;
    try {
      const reserved = await communicationApi.reserve(current.sessionId, current.participationId, current.generation, "screen");
      await room.localParticipant.setScreenShareEnabled(true);
      setPresenting(true);
      sourcesRef.current = { ...sourcesRef.current, screen: "on" };
      const { Track } = await import("livekit-client");
      const publication = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
      void reserved;
      publication?.track?.mediaStreamTrack.addEventListener("ended", () => {
        void stopPresentation();
      });
    } catch (error) {
      await room.localParticipant.setScreenShareEnabled(false).catch(() => undefined);
      const code = (error as { code?: string }).code;
      toast.error(code === "PRESENTATION_BUSY" ? "Outra pessoa começou a apresentar." : "Não foi possível apresentar.");
    }
  }, [stopPresentation]);

  useEffect(() => {
    const onPageHide = () => {
      const current = joinRef.current;
      if (current) {
        const body = JSON.stringify({ participationId: current.participationId, generation: current.generation });
        navigator.sendBeacon(`/api/communication/sessions/${current.sessionId}/leave`, body);
      }
    };
    window.addEventListener("pagehide", onPageHide);
    const channel = new BroadcastChannel("convext-communication");
    channel.onmessage = (event) => {
      if (event.data === "leave") void leave();
    };
    const timer = window.setInterval(async () => {
      const current = joinRef.current;
      if (!current || state !== "connected") return;
      await fetch(`/api/communication/sessions/${current.sessionId}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participationId: current.participationId, generation: current.generation }),
      }).catch(() => undefined);
    }, 20_000);
    const inbox = window.setInterval(async () => {
      try {
        const { notifications } = await communicationApi.notifications();
        const ringing = notifications.find((item) => item.kind === "incoming_call" && !item.readAt);
        setIncoming(ringing || null);
      } catch {
        // ignore
      }
    }, 4000);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      channel.close();
      window.clearInterval(timer);
      window.clearInterval(inbox);
    };
  }, [leave, state]);

  useEffect(() => {
    const onStage = pathname.startsWith("/app/salas/") || pathname.startsWith("/app/chamadas/");
    document.documentElement.style.setProperty("--call-dock-offset", state === "connected" && !onStage ? "88px" : "0px");
  }, [pathname, state]);

  const respondIncoming = useCallback(async (action: "accept" | "decline") => {
    if (!incoming?.referenceId) return;
    const inviteId = String(incoming.payload.inviteId || incoming.id);
    await communicationApi.respondCall(inviteId, action);
    await communicationApi.readNotification(incoming.id).catch(() => undefined);
    if (action === "accept") {
      await connect({ sessionId: incoming.referenceId, title: "Chamada" });
    }
    setIncoming(null);
  }, [connect, incoming]);

  const value = useMemo<CommunicationValue>(() => ({
    state,
    join,
    title,
    startedAt,
    microphone,
    camera,
    presenting,
    presentationAudio,
    remoteAudioBlocked,
    participants,
    incoming,
    connect,
    leave,
    setMicrophone,
    setCamera,
    startPresentation,
    stopPresentation,
    enableRemoteAudio: async () => {
      await roomRef.current?.startAudio();
      setRemoteAudioBlocked(false);
    },
    respondIncoming,
  }), [state, join, title, startedAt, microphone, camera, presenting, presentationAudio, remoteAudioBlocked, participants, incoming, connect, leave, setMicrophone, setCamera, startPresentation, stopPresentation, respondIncoming]);

  return <CommunicationContext.Provider value={value}>{children}</CommunicationContext.Provider>;
}

export function CallAudioRenderer() {
  return <div className="sr-only" aria-hidden="true" />;
}
