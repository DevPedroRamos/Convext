"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, CameraOff, ChevronDown, LockKeyhole, Mic, MicOff, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommunication } from "@/components/communication/communication-provider";
import type { RoomRecord } from "@/types/communication";

export function PrejoinPanel({
  title,
  access,
  hrefBack = "/app/salas",
  roomId,
  sessionId,
}: {
  title: string;
  access?: RoomRecord["access"];
  hrefBack?: string;
  roomId?: string;
  sessionId?: string;
}) {
  const { connect, state, join } = useCommunication();
  const [mic, setMic] = useState(false);
  const [camera, setCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function toggleCamera() {
    if (camera) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCamera(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamera(true);
    } catch {
      setCamera(false);
    }
  }

  async function enter(listenOnly: boolean) {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    await connect({ roomId, sessionId, title, listenOnly });
  }

  if (state === "connected" && join) {
    return (
      <div className="rounded-2xl bg-card p-8 ring-1 ring-border">
        <p className="font-medium">Você já está nesta sessão.</p>
        <Button asChild className="mt-4"><Link href={sessionId ? `/app/chamadas/${sessionId}` : `/app/salas/${roomId}`}>Voltar à chamada</Link></Button>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <Button asChild variant="ghost"><Link href={hrefBack}><ArrowLeft /> Voltar</Link></Button>
        {access ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {access === "private" ? <LockKeyhole className="size-3.5" /> : <Users className="size-3.5" />}
            {access === "private" ? "Privada por convite" : "Aberta à equipe"}
          </span>
        ) : null}
      </div>
      <div className="grid gap-8 p-5 md:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)] md:p-8">
        <div className="relative grid min-h-72 place-items-center overflow-hidden rounded-2xl bg-[#0a0a0a] ring-1 ring-border">
          <video ref={videoRef} autoPlay muted playsInline className={camera ? "absolute inset-0 size-full -scale-x-100 object-cover" : "hidden"} />
          {!camera ? <p className="text-sm text-muted-foreground">Sua câmera está desligada</p> : null}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Button size="icon-lg" className="min-h-11 min-w-11" variant={mic ? "secondary" : "destructive"} onClick={() => setMic((value) => !value)} aria-pressed={mic} aria-label={mic ? "Desligar microfone" : "Ligar microfone"}>{mic ? <Mic /> : <MicOff />}</Button>
            <Button size="icon-lg" className="min-h-11 min-w-11" variant={camera ? "secondary" : "destructive"} onClick={() => void toggleCamera()} aria-pressed={camera} aria-label={camera ? "Desligar câmera" : "Ligar câmera"}>{camera ? <Camera /> : <CameraOff />}</Button>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-sm text-muted-foreground">Antes de entrar</p>
          <h2 className="mt-2 font-display text-3xl tracking-[-0.04em]">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">O preview é local. Nada é transmitido até você entrar. Microfone e câmera começam desligados.</p>
          <div className="mt-6 grid gap-2">
            <Button variant="outline" className="h-11 justify-between px-4"><span className="flex items-center gap-2"><Mic className="size-4" /> Microfone padrão</span><ChevronDown className="size-4" /></Button>
            <Button variant="outline" className="h-11 justify-between px-4"><span className="flex items-center gap-2"><Camera className="size-4" /> Câmera padrão</span><ChevronDown className="size-4" /></Button>
          </div>
          <div className="mt-7 grid gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            <Button variant="outline" size="lg" disabled={state === "joining"} onClick={() => void enter(true)}>Entrar só para ouvir</Button>
            <Button size="lg" disabled={state === "joining"} onClick={() => void enter(false)}>{state === "joining" ? "Entrando..." : "Entrar na sala"}</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
