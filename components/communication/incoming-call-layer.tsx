"use client";

import { PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommunication } from "@/components/communication/communication-provider";

export function IncomingCallLayer() {
  const { incoming, respondIncoming, state, title } = useCommunication();
  if (!incoming) return null;
  const busy = state === "connected" || state === "reconnecting";
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-end p-4">
      <div className="pointer-events-auto w-full max-w-sm rounded-2xl bg-card p-4 shadow-lg ring-1 ring-border">
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-secondary"><PhoneCall className="size-5" /></div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Alguém está chamando</p>
            {busy ? <p className="mt-1 text-sm text-muted-foreground">Você está em {title}. Sair e atender?</p> : <p className="mt-1 text-sm text-muted-foreground">Chamada direta da equipe.</p>}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => void respondIncoming("decline")}>Recusar</Button>
          <Button onClick={() => void respondIncoming("accept")}>{busy ? "Sair e atender" : "Aceitar"}</Button>
        </div>
      </div>
    </div>
  );
}
