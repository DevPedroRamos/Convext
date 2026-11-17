"use client";

import { useMemo, useState } from "react";
import { Camera, CameraOff, Mic, MicOff, MonitorUp, MoreHorizontal, PhoneOff, Settings2, Users, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCommunication } from "@/components/communication/communication-provider";
import { cn } from "@/lib/utils";

function formatDuration(startedAt: number | null) {
  if (!startedAt) return "00:00";
  const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function CallStage() {
  const { title, startedAt, participants, microphone, camera, presenting, presentationAudio, remoteAudioBlocked, setMicrophone, setCamera, startPresentation, stopPresentation, leave, enableRemoteAudio, state } = useCommunication();
  const [peopleOpen, setPeopleOpen] = useState(true);
  const [mobilePeopleOpen, setMobilePeopleOpen] = useState(false);
  const screen = participants.find((item) => item.screenTrack);

  const tiles = useMemo(() => participants, [participants]);

  return (
    <section className="overflow-hidden rounded-2xl bg-[#0a0a0a] ring-1 ring-border">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-400" /><h2 className="truncate font-medium">{title}</h2></div>
          <p className="mt-0.5 text-xs text-muted-foreground">{state === "reconnecting" ? "Reconectando" : "Conectado"} · {formatDuration(startedAt)}</p>
        </div>
        <Button variant="ghost" onClick={() => {
          if (window.matchMedia("(min-width: 1280px)").matches) setPeopleOpen((value) => !value);
          else setMobilePeopleOpen(true);
        }} aria-label="Abrir painel de pessoas"><Users /> Pessoas {participants.length}</Button>
        <Button variant="ghost" size="icon" aria-label="Mais opções"><MoreHorizontal /></Button>
      </div>
      {remoteAudioBlocked ? (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary px-4 py-2 text-sm">
          <span>O navegador bloqueou o áudio da chamada.</span>
          <Button size="sm" onClick={() => void enableRemoteAudio()}>Ativar áudio da chamada</Button>
        </div>
      ) : null}
      <div className={cn("grid min-h-[520px]", peopleOpen && "xl:grid-cols-[minmax(0,1fr)_280px]")}>
        <div className="flex min-w-0 flex-col p-3 sm:p-5">
          {screen?.screenTrack ? (
            <div className="flex flex-1 flex-col gap-3">
              <div className="relative grid min-h-80 flex-1 place-items-center overflow-hidden rounded-2xl bg-[#171717] ring-1 ring-border">
                <video
                  ref={(node) => {
                    const track = screen.screenTrack as { attach?: (el: HTMLVideoElement) => void } | undefined;
                    if (node && track?.attach) track.attach(node);
                  }}
                  autoPlay
                  playsInline
                  className="max-h-full max-w-full object-contain"
                />
                <div className="absolute left-4 top-4 rounded-lg bg-black/75 px-3 py-1.5 text-xs text-white">{screen.isLocal ? "Você está apresentando" : `${screen.name} está apresentando`}</div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {tiles.map((person) => <div key={person.identity} className="w-32 shrink-0"><ParticipantCard person={person} compact /></div>)}
              </div>
              {screen.isLocal && presentationAudio ? <p className="text-xs text-muted-foreground">Áudio da apresentação ativo</p> : null}
            </div>
          ) : (
            <div className="grid flex-1 auto-rows-fr gap-3 sm:grid-cols-2">
              {tiles.map((person) => <ParticipantCard key={person.identity} person={person} />)}
            </div>
          )}
        </div>
        {peopleOpen ? (
          <aside className="hidden border-l border-border bg-card/60 p-4 xl:block">
            <div className="flex items-center justify-between"><h3 className="font-medium">Pessoas</h3><Button variant="ghost" size="icon-sm" onClick={() => setPeopleOpen(false)} aria-label="Fechar painel"><X /></Button></div>
            <div className="mt-5 grid gap-2">
              {tiles.map((person) => (
                <div key={person.identity} className="flex items-center gap-3 rounded-xl p-2 hover:bg-secondary">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{person.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{person.speaking ? "Falando agora" : person.micOn ? "Ouvindo" : "Mic desligado"}</p>
                  </div>
                  {person.speaking ? <Volume2 className="size-4 text-primary" /> : <MicOff className="size-4 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
      <Sheet open={mobilePeopleOpen} onOpenChange={setMobilePeopleOpen}>
        <SheetContent className="xl:hidden">
          <SheetHeader className="pt-6">
            <SheetTitle>Pessoas na sala</SheetTitle>
            <SheetDescription>{participants.length} participantes.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border bg-card px-3 py-3 sm:gap-3">
        <Button size="icon-lg" className="min-h-11 min-w-11" variant={microphone ? "secondary" : "destructive"} onClick={() => void setMicrophone(!microphone)} aria-pressed={microphone} aria-label={microphone ? "Desligar microfone" : "Ligar microfone"}>{microphone ? <Mic /> : <MicOff />}</Button>
        <Button size="icon-lg" className="min-h-11 min-w-11" variant={camera ? "secondary" : "destructive"} onClick={() => void setCamera(!camera)} aria-pressed={camera} aria-label={camera ? "Desligar câmera" : "Ligar câmera"}>{camera ? <Camera /> : <CameraOff />}</Button>
        <Button size="lg" className="min-h-11" variant={presenting ? "default" : "secondary"} onClick={() => presenting ? void stopPresentation() : void startPresentation()} aria-pressed={presenting}><MonitorUp /> <span className="hidden sm:inline">{presenting ? "Parar apresentação" : "Apresentar"}</span></Button>
        <Button size="icon-lg" className="min-h-11 min-w-11" variant="secondary" aria-label="Configurar dispositivos"><Settings2 /></Button>
        <Button size="lg" className="min-h-11" variant="destructive" onClick={() => void leave()} aria-label="Sair da chamada"><PhoneOff /> <span className="hidden sm:inline">Sair</span></Button>
      </div>
    </section>
  );
}

function ParticipantCard({ person, compact }: { person: { name: string; speaking: boolean; micOn: boolean; cameraTrack?: { attach: (el: HTMLVideoElement) => void } | null }; compact?: boolean }) {
  return (
    <div className={cn("relative grid place-items-center overflow-hidden rounded-2xl bg-[#121212] ring-1 ring-border", compact ? "min-h-24" : "min-h-44", person.speaking && "ring-2 ring-primary")}>
      {person.cameraTrack ? <video ref={(node) => { if (node) person.cameraTrack?.attach(node); }} autoPlay muted={false} playsInline className="absolute inset-0 size-full object-cover" /> : null}
      <span className="absolute inset-x-3 bottom-3 truncate rounded-md bg-black/70 px-2 py-1 text-xs text-white">{person.name}</span>
      {person.speaking ? <span className="absolute right-3 bottom-3 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground">Falando</span> : null}
    </div>
  );
}
