"use client";

import { useState } from "react";
import { TaskCard } from "@/components/spaces/task-card";
import { TaskSheet } from "@/components/spaces/task-sheet";
import { isMyTurn, type Viewer } from "@/lib/spaces/rules";
import type { Space, SpaceForm, SpaceTask } from "@/lib/spaces/types";

export function MyTasks({ tasks, spaces, forms, viewer }: { tasks: SpaceTask[]; spaces: Space[]; forms: SpaceForm[]; viewer: Viewer }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const spaceById = new Map(spaces.map((space) => [space.id, space]));
  const stageById = new Map(spaces.flatMap((space) => space.stages.map((stage) => [stage.id, stage] as const)));
  const turn = tasks.filter((task) => { const stage = stageById.get(task.stageId); return stage && isMyTurn(task, stage, viewer); });
  const mine = tasks.filter((task) => task.createdBy === viewer.id);
  const selected = selectedId ? tasks.find((task) => task.id === selectedId) ?? null : null;

  function column(title: string, hint: string, items: SpaceTask[], empty: string) {
    return (
      <section className="surface grid content-start gap-3 p-5">
        <div className="flex items-center gap-2"><h3 className="text-base font-medium">{title}</h3><span className="rounded-full border border-border px-2 text-xs text-muted-foreground">{items.length}</span></div>
        <p className="text-sm text-muted-foreground">{hint}</p>
        {items.length ? items.map((task) => (
          <TaskCard key={task.id} task={task} stage={stageById.get(task.stageId)} space={spaceById.get(task.spaceId)} myTurn={turn.includes(task)} showSpace onOpen={() => setSelectedId(task.id)} />
        )) : <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{empty}</p>}
      </section>
    );
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-2">
        {column("Sua vez", "Tarefas numa etapa cujo dono é você ou a sua role.", turn, "Nada esperando por você.")}
        {column("Minhas solicitações", "O que você abriu, em qualquer espaço, com a etapa atual.", mine, "Você ainda não abriu nenhuma tarefa. Use o atalho rápido.")}
      </div>
      <TaskSheet
        task={selected}
        space={selected ? spaceById.get(selected.spaceId) ?? null : null}
        form={selected ? forms.find((form) => form.id === selected.formId) ?? null : null}
        viewer={viewer}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}
