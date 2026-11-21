"use client";

import { StatusBadge } from "@/components/finance/ui";
import { ownerLabel } from "@/lib/spaces/roles";
import type { Space, SpaceStage, SpaceTask } from "@/lib/spaces/types";
import { cn } from "@/lib/utils";

export function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
}

export function TaskCard({ task, stage, space, myTurn, showSpace, onOpen }: { task: SpaceTask; stage: SpaceStage | undefined; space?: Space; myTurn: boolean; showSpace?: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "surface grid w-full gap-2 p-3 text-left transition hover:border-foreground/20",
        myTurn && "border-primary/60 shadow-[inset_3px_0_0_var(--primary)]",
      )}
    >
      {showSpace && space ? (
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-[3px]" style={{ background: space.color }} />
          {space.name} · {stage?.name}
        </span>
      ) : null}
      <span className="text-sm font-medium">{task.title}</span>
      <span className="text-xs text-muted-foreground">{[task.clientName, timeAgo(task.createdAt)].filter(Boolean).join(" · ")}</span>
      <span className="flex flex-wrap items-center gap-1.5">
        {stage?.type === "done" ? (
          <StatusBadge label="Concluída" tone="positive" />
        ) : task.assigneeName ? (
          <StatusBadge label={task.assigneeName.split(" ")[0]} />
        ) : (
          <StatusBadge label={ownerLabel(stage?.ownerRole)} />
        )}
        {stage?.type === "approval" ? <StatusBadge label="Aprovação" tone="warning" /> : null}
        {myTurn ? <StatusBadge label="Sua vez" tone="warning" /> : null}
      </span>
    </button>
  );
}
