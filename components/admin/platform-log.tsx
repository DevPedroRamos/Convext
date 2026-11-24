"use client";

import { FilePlus, Pencil, Trash2 } from "lucide-react";
import { timeAgo } from "@/components/spaces/task-card";
import type { PlatformEvent } from "@/lib/admin/logs";
import { cn } from "@/lib/utils";

const icons = {
  created: FilePlus,
  updated: Pencil,
  deleted: Trash2,
} as const;

const kindLabel = {
  created: "Criação",
  updated: "Alteração",
  deleted: "Remoção",
} as const;

const areaLabel = {
  equipe: "Equipe",
  gestao: "Gestão",
  financeiro: "Financeiro",
} as const;

export function PlatformLog({ events }: { events: PlatformEvent[] }) {
  if (!events.length) {
    return <p className="rounded-md border bg-card px-4 py-8 text-center text-sm text-muted-foreground">Nenhum registro ainda.</p>;
  }
  return (
    <div className="rounded-md border bg-card">
      {events.map((event, index) => {
        const Icon = icons[event.kind] ?? Pencil;
        return (
          <div key={event.id} className={cn("relative flex gap-3 px-4 py-3", event.kind === "deleted" && "bg-muted/40")}>
            {index < events.length - 1 ? <div className="absolute top-9 bottom-0 left-[1.55rem] w-px bg-border" /> : null}
            <div className={cn("z-1 flex size-5 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground", event.kind === "deleted" && "border-destructive text-destructive")}>
              <Icon className="size-3" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={cn("text-sm font-medium", event.kind === "deleted" && "text-destructive")}>{event.message}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(event.createdAt)}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium">{event.actorName?.split(" ")[0] ?? "Sistema"}</span>
                <span className="rounded-full border px-2 py-0.5 text-muted-foreground">{areaLabel[event.area]}</span>
                <span className="rounded-full border px-2 py-0.5 text-muted-foreground">{kindLabel[event.kind]}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
