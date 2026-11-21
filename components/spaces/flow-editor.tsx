"use client";

import { ArrowDown, ArrowUp, Loader2, Plus, Trash, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { spacesRequest } from "@/components/spaces/api";
import { Field } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AppRole } from "@/lib/access";
import { ownerLabel, roleLabels, SPACE_ROLES, type StageOwner } from "@/lib/spaces/roles";
import { flowProblems, orderedStages } from "@/lib/spaces/rules";
import type { Space, StageType } from "@/lib/spaces/types";
import { cn } from "@/lib/utils";

type DraftStage = { key: string; id?: string; name: string; type: StageType; ownerRole: StageOwner | null; requiresLabel: string; notify: boolean; rejectTo: string | null };
type Draft = { id: string | null; name: string; color: string; memberRoles: AppRole[]; stages: DraftStage[] };

const COLORS = ["#f35703", "#3987e5", "#199e70", "#9085e9", "#c98500", "#d55181", "#0ca30c", "#e66767"];
let seq = 0;
const newKey = () => `new-${Date.now().toString(36)}-${seq++}`;

function toDraft(space: Space): Draft {
  return {
    id: space.id,
    name: space.name,
    color: space.color,
    memberRoles: [...space.memberRoles],
    stages: orderedStages(space).map((stage) => ({ key: stage.id, id: stage.id, name: stage.name, type: stage.type, ownerRole: stage.ownerRole, requiresLabel: stage.requiresLabel ?? "", notify: stage.notify, rejectTo: stage.rejectTo })),
  };
}

function blankDraft(): Draft {
  return {
    id: null,
    name: "Novo espaço",
    color: COLORS[3],
    memberRoles: ["admin"],
    stages: [
      { key: newKey(), name: "A fazer", type: "normal", ownerRole: "admin", requiresLabel: "", notify: true, rejectTo: null },
      { key: newKey(), name: "Fazendo", type: "normal", ownerRole: "admin", requiresLabel: "", notify: false, rejectTo: null },
      { key: newKey(), name: "Feito", type: "done", ownerRole: null, requiresLabel: "", notify: true, rejectTo: null },
    ],
  };
}

export function FlowEditor({ spaces, initialId }: { spaces: Space[]; initialId?: string | null }) {
  const router = useRouter();
  const start = spaces.find((space) => space.id === initialId) ?? spaces[0];
  const [draft, setDraft] = useState<Draft>(start ? toDraft(start) : blankDraft());
  const [saving, setSaving] = useState(false);
  const problems = flowProblems(draft.stages);

  function pick(space: Space | null) {
    setDraft(space ? toDraft(space) : blankDraft());
  }
  function patch(next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }));
  }
  function patchStage(index: number, next: Partial<DraftStage>) {
    setDraft((current) => {
      const stages = current.stages.map((stage, i) => (i === index ? { ...stage, ...next } : stage));
      const stage = stages[index];
      if (next.type === "done") stage.ownerRole = null;
      if (next.type && next.type !== "done" && !stage.ownerRole) stage.ownerRole = "admin";
      if (next.type === "approval" && !stage.rejectTo && index > 0) stage.rejectTo = stages[index - 1].key;
      return { ...current, stages };
    });
  }
  function moveStage(index: number, delta: number) {
    setDraft((current) => {
      const stages = [...current.stages];
      const [item] = stages.splice(index, 1);
      stages.splice(index + delta, 0, item);
      return { ...current, stages };
    });
  }
  function removeStage(index: number) {
    setDraft((current) => {
      const removed = current.stages[index];
      const stages = current.stages.filter((_, i) => i !== index).map((stage) => (stage.rejectTo === removed.key ? { ...stage, rejectTo: null } : stage));
      return { ...current, stages };
    });
  }
  function addStage() {
    setDraft((current) => {
      const stages = [...current.stages];
      stages.splice(Math.max(stages.length - 1, 0), 0, { key: newKey(), name: "Nova etapa", type: "normal", ownerRole: "admin", requiresLabel: "", notify: true, rejectTo: null });
      return { ...current, stages };
    });
  }

  async function save() {
    if (problems.length) return;
    setSaving(true);
    const keys = draft.stages.map((stage) => stage.key);
    const body = {
      name: draft.name,
      color: draft.color,
      memberRoles: draft.memberRoles,
      stages: draft.stages.map((stage) => {
        const target = stage.rejectTo ? draft.stages.find((item) => item.key === stage.rejectTo) : null;
        return {
          id: stage.id,
          name: stage.name,
          type: stage.type,
          ownerRole: stage.type === "done" ? null : stage.ownerRole,
          requiresLabel: stage.requiresLabel.trim() || null,
          notify: stage.notify,
          rejectTo: stage.type === "approval" && target ? (target.id ?? `#${keys.indexOf(target.key)}`) : null,
        };
      }),
    };
    const id = await spacesRequest<string>(draft.id ? `/api/spaces/${draft.id}` : "/api/spaces", draft.id ? "PUT" : "POST", body, "Espaço salvo.");
    setSaving(false);
    if (!id) return;
    router.replace(`/app/gestao/espacos?espaco=${id}`);
    router.refresh();
    if (!draft.id) setDraft((current) => ({ ...current, id }));
  }

  async function remove() {
    if (!draft.id || !window.confirm(`Excluir o espaço “${draft.name}” com todas as tarefas e formulários?`)) return;
    if (await spacesRequest(`/api/spaces/${draft.id}`, "DELETE", undefined, "Espaço excluído.")) {
      router.replace("/app/gestao/espacos");
      router.refresh();
      const rest = spaces.filter((space) => space.id !== draft.id);
      pick(rest[0] ?? null);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2">
        {spaces.map((space) => (
          <button key={space.id} type="button" onClick={() => pick(space)} aria-pressed={draft.id === space.id} className={cn("flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground", draft.id === space.id && "border-primary bg-primary/10 text-foreground")}>
            <span className="size-2 rounded-[3px]" style={{ background: space.color }} />{space.name}
          </button>
        ))}
        <button type="button" onClick={() => pick(null)} aria-pressed={!draft.id} className={cn("rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground", !draft.id && "border-primary text-foreground")}>
          <Plus className="mr-1 inline size-3.5" />Novo espaço
        </button>
      </div>

      <section className="surface grid gap-4 p-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Field label="Nome do espaço"><Input value={draft.name} onChange={(event) => patch({ name: event.target.value })} /></Field>
          <Field label="Cor">
            <div className="flex gap-1.5">
              {COLORS.map((color) => (
                <button key={color} type="button" aria-label={`Cor ${color}`} aria-pressed={draft.color === color} onClick={() => patch({ color })} className={cn("size-8 rounded-md border-2 border-transparent", draft.color === color && "border-foreground")} style={{ background: color }} />
              ))}
            </div>
          </Field>
        </div>
        <Field label="Membros (veem todas as tarefas do espaço)" hint="Quem não é membro vê só as tarefas que abriu.">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {SPACE_ROLES.map((role) => (
              <label key={role} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.memberRoles.includes(role)} disabled={role === "admin"} onChange={(event) => patch({ memberRoles: event.target.checked ? [...draft.memberRoles, role] : draft.memberRoles.filter((item) => item !== role) })} />
                {roleLabels[role]}
              </label>
            ))}
          </div>
        </Field>
      </section>

      <section className="surface grid gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-medium">Fluxo</h3>
          <Button variant="outline" size="sm" onClick={addStage}><Plus /> Etapa</Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {draft.stages.map((stage, index) => (
            <span key={stage.key} className="flex items-center gap-1.5">
              <span className={cn("grid rounded-md border border-border px-2.5 py-1.5", stage.type === "approval" && "border-primary/50", stage.type === "done" && "border-emerald-500/40")}>
                <span className="text-sm text-foreground">{stage.name || "Sem nome"}</span>
                <span className="text-muted-foreground">{stage.type === "done" ? "fim" : `${ownerLabel(stage.ownerRole)}${stage.type === "approval" ? " · aprova" : ""}`}</span>
              </span>
              {index < draft.stages.length - 1 ? <span className="text-muted-foreground">→</span> : null}
            </span>
          ))}
        </div>
        <div className="grid gap-2">
          {draft.stages.map((stage, index) => (
            <div key={stage.key} className="grid gap-2 rounded-lg border border-border bg-background/40 p-3">
              <div className="grid gap-2 sm:grid-cols-[24px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
                <span className="hidden text-center font-mono text-xs text-muted-foreground sm:block">{index + 1}</span>
                <Input value={stage.name} onChange={(event) => patchStage(index, { name: event.target.value })} aria-label="Nome da etapa" />
                <Select value={stage.type} onValueChange={(value) => patchStage(index, { type: value as StageType })}>
                  <SelectTrigger className="w-full" aria-label="Tipo da etapa"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Etapa</SelectItem>
                    <SelectItem value="approval">Aprovação</SelectItem>
                    <SelectItem value="done">Concluída</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={stage.ownerRole ?? "none"} disabled={stage.type === "done"} onValueChange={(value) => patchStage(index, { ownerRole: value === "none" ? null : value as StageOwner })}>
                  <SelectTrigger className="w-full" aria-label="Dono da etapa"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {SPACE_ROLES.map((role) => <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>)}
                    <SelectItem value="requester">Quem solicitou</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label="Subir" disabled={index === 0} onClick={() => moveStage(index, -1)}><ArrowUp /></Button>
                  <Button size="icon" variant="ghost" aria-label="Descer" disabled={index === draft.stages.length - 1} onClick={() => moveStage(index, 1)}><ArrowDown /></Button>
                  <Button size="icon" variant="ghost" aria-label="Remover etapa" disabled={draft.stages.length <= 2} onClick={() => removeStage(index)}><X /></Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground sm:pl-8">
                {stage.type !== "done" ? (
                  <label className="flex items-center gap-2">Exige para concluir
                    <Input className="h-8 w-48" value={stage.requiresLabel} placeholder="ex.: Link da arte" onChange={(event) => patchStage(index, { requiresLabel: event.target.value })} />
                  </label>
                ) : null}
                <label className="flex items-center gap-2"><Switch checked={stage.notify} onCheckedChange={(notify) => patchStage(index, { notify })} /> Avisar ao entrar</label>
                {stage.type === "approval" ? (
                  <label className="flex items-center gap-2">Se recusar, volta para
                    <Select value={stage.rejectTo ?? "none"} onValueChange={(value) => patchStage(index, { rejectTo: value === "none" ? null : value })}>
                      <SelectTrigger className="w-full min-w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Etapa anterior</SelectItem>
                        {draft.stages.slice(0, index).map((item) => <SelectItem key={item.key} value={item.key}>{item.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </label>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          Cada etapa é uma coluna do quadro. O dono recebe a tarefa quando ela entra na etapa. Aprovação mostra Aprovar e Recusar só para o dono. “Exige para concluir” pede uma informação (como um link) antes de avançar. Ao remover uma etapa, as tarefas dela vão para a etapa anterior.
        </p>
        {problems.length ? <ul className="grid gap-1 text-sm text-destructive">{problems.map((problem) => <li key={problem}>{problem}</li>)}</ul> : null}
        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={saving || problems.length > 0}>{saving ? <Loader2 className="animate-spin" /> : null}{draft.id ? "Salvar espaço" : "Criar espaço"}</Button>
          {draft.id ? <Button variant="outline" asChild><Link href={`/app/espacos/${draft.id}`}>Ver quadro</Link></Button> : null}
          {draft.id ? <Button variant="ghost" className="ml-auto text-destructive" onClick={remove}><Trash /> Excluir espaço</Button> : null}
        </div>
      </section>
    </div>
  );
}
