"use client";

import { Calendar, CalendarClock, CalendarX, Check, FilePlus, Hand, MessageSquare, Pencil, RotateCcw, Send, ShieldCheck, Shuffle, X } from "lucide-react";
import { timeAgo } from "@/components/spaces/task-card";
import type { TaskEvent } from "@/lib/spaces/types";
import { cn } from "@/lib/utils";

const icons: Record<TaskEvent["kind"], typeof Send> = {
  created: FilePlus,
  advanced: Send,
  approved: ShieldCheck,
  rejected: X,
  claimed: Hand,
  moved: Shuffle,
  comment: MessageSquare,
  scheduled: Calendar,
  rescheduled: CalendarClock,
  unscheduled: CalendarX,
  updated: Pencil,
  reworked: RotateCcw,
};

export function TaskHistory({ events }: { events: TaskEvent[] }) {
  const items = [...events].reverse();
  if (!items.length) {
    return <p className="rounded-md border bg-card px-4 py-8 text-center text-sm text-muted-foreground">Nenhum evento ainda.</p>;
  }
  return (
    <div className="rounded-md border bg-card">
      {items.map((event, index) => {
        const Icon = icons[event.kind] ?? Check;
        return (
          <div key={event.id} className={cn("relative flex gap-3 px-4 py-3", event.kind === "comment" && "bg-muted/40")}>
            {index < items.length - 1 ? <div className="absolute top-9 bottom-0 left-[1.55rem] w-px bg-border" /> : null}
            <div className={cn("z-1 flex size-5 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground", (event.kind === "rejected" || event.kind === "reworked") && "border-destructive text-destructive")}>
              <Icon className="size-3" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={cn("text-sm font-medium", (event.kind === "rejected" || event.kind === "reworked") && "text-destructive")}>{event.message}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(event.createdAt)}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium">{event.actorName?.split(" ")[0] ?? "Sistema"}</span>
                <span className="rounded-full border px-2 py-0.5 text-muted-foreground">{kindLabel(event.kind)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function kindLabel(kind: TaskEvent["kind"]) {
  if (kind === "created") return "Abertura";
  if (kind === "advanced") return "Avanço";
  if (kind === "approved") return "Aprovação";
  if (kind === "rejected") return "Recusa";
  if (kind === "claimed") return "Assumiu";
  if (kind === "moved") return "Movida";
  if (kind === "scheduled") return "Agendado";
  if (kind === "rescheduled") return "Remarcado";
  if (kind === "unscheduled") return "Removido";
  if (kind === "updated") return "Edição";
  if (kind === "reworked") return "Reajuste";
  return "Comentário";
}
