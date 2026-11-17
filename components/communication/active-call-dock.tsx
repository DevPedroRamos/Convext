"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, CameraOff, Mic, MicOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommunication } from "@/components/communication/communication-provider";

export function ActiveCallDock() {
  const pathname = usePathname();
  const { state, title, join, microphone, camera, setMicrophone, setCamera, leave } = useCommunication();
  const onStage = pathname.startsWith("/app/salas/") || pathname.startsWith("/app/chamadas/");
  if (state !== "connected" && state !== "reconnecting") return null;
  if (onStage) return null;
  const href = join?.kind === "direct" ? `/app/chamadas/${join.sessionId}` : `/app/salas/${join?.roomId}`;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-lg ring-1 ring-border">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{state === "reconnecting" ? "Reconectando" : "Em chamada"}</p>
        </div>
        <Button size="icon-lg" className="min-h-11 min-w-11" variant={microphone ? "secondary" : "destructive"} onClick={() => void setMicrophone(!microphone)} aria-label="Microfone">{microphone ? <Mic /> : <MicOff />}</Button>
        <Button size="icon-lg" className="min-h-11 min-w-11" variant={camera ? "secondary" : "destructive"} onClick={() => void setCamera(!camera)} aria-label="Câmera">{camera ? <Camera /> : <CameraOff />}</Button>
        <Button asChild size="lg" className="min-h-11"><Link href={href}>Abrir</Link></Button>
        <Button size="lg" className="min-h-11" variant="destructive" onClick={() => void leave()} aria-label="Sair"><PhoneOff /> Sair</Button>
      </div>
    </div>
  );
}
