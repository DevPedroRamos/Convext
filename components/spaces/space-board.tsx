"use client";

import { GripVertical, Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { spacesRequest } from "@/components/spaces/api";
import { TaskCard } from "@/components/spaces/task-card";
import { type AttendeeOption } from "@/components/spaces/appointment-field";
import { type ClientOption, TaskFormDialog } from "@/components/spaces/task-form-dialog";
import { TaskSheet } from "@/components/spaces/task-sheet";
import { StatusBadge } from "@/components/finance/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kanban, KanbanBoard, KanbanColumn, KanbanColumnContent, KanbanItem, KanbanItemHandle, KanbanOverlay } from "@/components/ui/kanban";
import { ownerLabel, roleLabels } from "@/lib/spaces/roles";
import { canAct, canSeeSpace, canSubmitForm, isMyTurn, missingRequirement, nextStage, orderedStages, type Viewer } from "@/lib/spaces/rules";
import type { FeedbackType } from "@/lib/feedback-types";
import type { Space, SpaceForm, SpaceTask } from "@/lib/spaces/types";

type Props = { space: Space; tasks: SpaceTask[]; forms: SpaceForm[]; clients: ClientOption[]; attendees?: AttendeeOption[]; viewer: Viewer; feedbackTypes: FeedbackType[] };

export function SpaceBoard({ space, tasks, forms, clients, attendees = [], viewer, feedbackTypes }: Props) {
  const router = useRouter();
  const stages = orderedStages(space);
  const [query, setQuery] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState<SpaceForm | null>(null);
  const [override, setOverride] = useState<Record<string, SpaceTask[]> | null>(null);
  const member = canSeeSpace(space, viewer);
  const myForms = forms.filter((form) => form.spaceId === space.id && canSubmitForm(form, viewer.role));
  const stageById = new Map(stages.map((stage) => [stage.id, stage]));

  const term = query.trim().toLowerCase();
  const filtered = tasks.filter((task) => {
    const stage = stageById.get(task.stageId);
    if (onlyMine && !(stage && isMyTurn(task, stage, viewer)) && task.createdBy !== viewer.id) return false;
    if (!term) return true;
    return [task.title, task.clientName, task.assigneeName, task.createdByName].filter(Boolean).join(" ").toLowerCase().includes(term);
  });
  const grouped: Record<string, SpaceTask[]> = Object.fromEntries(stages.map((stage) => [stage.id, [] as SpaceTask[]]));
  for (const task of filtered) (grouped[task.stageId] ??= []).push(task);
  const columns = override ?? grouped;
  const selected = selectedId ? tasks.find((task) => task.id === selectedId) ?? null : null;

  async function drop(taskId: string, toStageId: string) {
    const task = tasks.find((item) => item.id === taskId);
    const stage = task ? stageById.get(task.stageId) : undefined;
    const target = stageById.get(toStageId);
    if (!task || !stage || !target || stage.id === target.id) return setOverride(null);
    if (viewer.role === "admin") {
      const done = await spacesRequest(`/api/spaces/tasks/${task.id}`, "POST", { action: "move", stageId: target.id }, `Movida para ${target.name}.`);
      setOverride(null);
      if (done) router.refresh();
      return;
    }
    setOverride(null);
    if (!canAct(task, stage, viewer)) return toast.error(`Só ${task.assigneeName ?? ownerLabel(stage.ownerRole)} pode mover esta tarefa agora.`);
    if (stage.type === "approval") return toast.error("Use Aprovar ou Recusar dentro da tarefa.");
    if (nextStage(space, stage.id)?.id !== target.id) return toast.error("Avance uma etapa por vez.");
    if (missingRequirement(task, stage)) {
      toast.message(`Informe ${stage.requiresLabel} para concluir.`);
      return setSelectedId(task.id);
    }
    const done = await spacesRequest(`/api/spaces/tasks/${task.id}`, "POST", { action: "advance" }, `Enviada para ${target.name}.`);
    if (done) router.refresh();
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Membros: {space.memberRoles.map((role) => roleLabels[role]).join(", ")}</span>
        {!member ? <StatusBadge label="Você vê só o que solicitou" tone="warning" /> : null}
        <div className="ml-auto flex flex-wrap gap-2">
          {myForms.map((form) => (
            <Button key={form.id} onClick={() => setOpenForm(form)}><Plus /> {form.name}</Button>
          ))}
          {viewer.role === "admin" ? (
            <Button variant="outline" asChild><Link href={`/app/gestao/espacos?espaco=${space.id}`}><Settings2 /> Editar fluxo</Link></Button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tarefa, cliente ou pessoa" className="w-full sm:w-72" aria-label="Buscar tarefas" />
        <Button variant={onlyMine ? "default" : "outline"} onClick={() => setOnlyMine((value) => !value)}>Minhas</Button>
      </div>

      <div className="overflow-x-auto pb-2">
        <Kanban
          value={columns}
          onValueChange={(value) => setOverride(value as Record<string, SpaceTask[]>)}
          getItemValue={(task) => task.id}
          restoreOnCancel
          onValueCommit={(_value, meta) => {
            if (meta.kind !== "item" || meta.activeContainer === meta.overContainer) return setOverride(null);
            drop(String(meta.event.active.id), meta.overContainer);
          }}
        >
          <KanbanBoard className="min-w-max" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(240px, 1fr))` }}>
            {stages.map((stage) => (
              <KanbanColumn key={stage.id} value={stage.id} disabled className="rounded-lg border border-border bg-card/40 p-2">
                <div className="mb-2 grid gap-1 px-1 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{stage.name}</span>
                    {stage.type === "approval" ? <StatusBadge label="Aprovação" tone="warning" /> : null}
                    <Badge variant="outline" className="ml-auto">{columns[stage.id]?.length ?? 0}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {stage.type === "done" ? "Concluídas nos últimos 30 dias" : `Dono: ${ownerLabel(stage.ownerRole)}${stage.requiresLabel ? ` · exige ${stage.requiresLabel}` : ""}`}
                  </span>
                </div>
                <KanbanColumnContent value={stage.id} className="min-h-28">
                  {(columns[stage.id] ?? []).map((task) => (
                    <KanbanItem key={task.id} value={task.id} className="relative">
                      <TaskCard task={task} stage={stage} myTurn={isMyTurn(task, stage, viewer)} onOpen={() => setSelectedId(task.id)} />
                      <KanbanItemHandle className="absolute top-2 right-2 text-muted-foreground" aria-label="Arrastar">
                        <GripVertical className="size-4" />
                      </KanbanItemHandle>
                    </KanbanItem>
                  ))}
                </KanbanColumnContent>
              </KanbanColumn>
            ))}
          </KanbanBoard>
          <KanbanOverlay />
        </Kanban>
      </div>
      <p className="text-xs text-muted-foreground">Arraste para a próxima coluna ou abra a tarefa. Só o dono da etapa avança; o admin move para qualquer coluna.</p>

      <TaskSheet task={selected} space={space} form={selected ? forms.find((form) => form.id === selected.formId) ?? null : null} viewer={viewer} attendees={attendees} onClose={() => setSelectedId(null)} />
      <TaskFormDialog form={openForm} space={space} clients={clients} attendees={attendees} feedbackTypes={feedbackTypes} onOpenChange={(open) => !open && setOpenForm(null)} />
    </div>
  );
}
