"use client";

import { ArrowUp, Loader2, Plus, Trash, X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { spacesRequest } from "@/components/spaces/api";
import { FieldInput } from "@/components/spaces/task-form-dialog";
import { Field } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AppRole } from "@/lib/access";
import { roleLabels, SPACE_ROLES } from "@/lib/spaces/roles";
import type { FeedbackType } from "@/lib/feedback-types";
import type { FieldType, FormField, QuickAction, Space, SpaceForm } from "@/lib/spaces/types";
import { cn } from "@/lib/utils";

const FIELD_LABELS: Record<FieldType, string> = { text: "Texto", longtext: "Texto longo", number: "Número", date: "Data", select: "Seleção", client: "Cliente", link: "Link", feedback: "Tipo de feedback", gallery: "Galeria", appointment: "Compromisso" };

type Draft = { id: string | null; spaceId: string; name: string; description: string; audienceRoles: AppRole[]; active: boolean; fields: FormField[] };

function toDraft(form: SpaceForm): Draft {
  return { id: form.id, spaceId: form.spaceId, name: form.name, description: form.description ?? "", audienceRoles: [...form.audienceRoles], active: form.active, fields: form.fields.map((field) => ({ ...field })) };
}
function blank(spaceId: string): Draft {
  return { id: null, spaceId, name: "Novo formulário", description: "", audienceRoles: ["admin"], active: true, fields: [{ key: "titulo", label: "Título", type: "text", required: true }] };
}
const fieldKey = () => `campo_${Math.random().toString(36).slice(2, 8)}`;

export function FormBuilder({ forms, spaces, quickActions, feedbackTypes }: { forms: SpaceForm[]; spaces: Space[]; quickActions: QuickAction[]; feedbackTypes: FeedbackType[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(forms[0] ? toDraft(forms[0]) : spaces[0] ? blank(spaces[0].id) : null);
  const [saving, setSaving] = useState(false);
  if (!draft) return <p className="text-sm text-muted-foreground">Crie um espaço antes de criar formulários.</p>;
  const spaceName = (id: string) => spaces.find((space) => space.id === id)?.name ?? "—";
  const inQuick = draft.id ? quickActions.some((action) => action.formId === draft.id) : false;

  function patch(next: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...next } : current));
  }
  function patchField(index: number, next: Partial<FormField>) {
    setDraft((current) => (current ? { ...current, fields: current.fields.map((field, i) => (i === index ? { ...field, ...next } : field)) } : current));
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    const body = { spaceId: draft.spaceId, name: draft.name, description: draft.description, audienceRoles: draft.audienceRoles, active: draft.active, fields: draft.fields };
    const id = await spacesRequest<string>(draft.id ? `/api/spaces/forms/${draft.id}` : "/api/spaces/forms", draft.id ? "PUT" : "POST", body, "Formulário salvo.");
    setSaving(false);
    if (!id) return;
    setDraft((current) => (current ? { ...current, id } : current));
    router.refresh();
  }

  async function remove() {
    if (!draft?.id || !window.confirm(`Excluir o formulário “${draft.name}”? As tarefas já abertas continuam.`)) return;
    if (await spacesRequest(`/api/spaces/forms/${draft.id}`, "DELETE", undefined, "Formulário excluído.")) {
      const rest = forms.filter((form) => form.id !== draft.id);
      setDraft(rest[0] ? toDraft(rest[0]) : blank(spaces[0].id));
      router.refresh();
    }
  }

  async function addToQuick() {
    if (!draft?.id) return;
    const actions = [...quickActions.map((action) => ({ id: action.id, label: action.label, kind: action.kind, formId: action.formId, systemAction: action.systemAction, audienceRoles: action.audienceRoles })), { label: draft.name, kind: "form" as const, formId: draft.id, systemAction: null, audienceRoles: draft.audienceRoles }];
    if (await spacesRequest("/api/spaces/quick-actions", "PUT", { actions }, "Adicionado ao atalho rápido para quem pode enviar.")) router.refresh();
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2">
        {forms.map((form) => (
          <button key={form.id} type="button" onClick={() => setDraft(toDraft(form))} aria-pressed={draft.id === form.id} className={cn("rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground", draft.id === form.id && "border-primary bg-primary/10 text-foreground", !form.active && "opacity-60")}>
            {form.name}<span className="ml-1.5 text-xs opacity-70">· {spaceName(form.spaceId)}</span>
          </button>
        ))}
        <button type="button" onClick={() => setDraft(blank(draft.spaceId))} aria-pressed={!draft.id} className={cn("rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground", !draft.id && "border-primary text-foreground")}>
          <Plus className="mr-1 inline size-3.5" />Novo formulário
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="surface grid content-start gap-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome"><Input value={draft.name} onChange={(event) => patch({ name: event.target.value })} /></Field>
            <Field label="Cai no espaço">
              <Select value={draft.spaceId} onValueChange={(spaceId) => patch({ spaceId })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {spaces.map((space) => <SelectItem key={space.id} value={space.id}>{space.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Descrição"><Input value={draft.description} onChange={(event) => patch({ description: event.target.value })} placeholder="Aparece no topo do formulário" /></Field>
          <Field label="Quem pode enviar">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {SPACE_ROLES.map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={draft.audienceRoles.includes(role)} onChange={(event) => patch({ audienceRoles: event.target.checked ? [...draft.audienceRoles, role] : draft.audienceRoles.filter((item) => item !== role) })} />
                  {roleLabels[role]}
                </label>
              ))}
            </div>
          </Field>
          <label className="flex items-center gap-2 text-sm"><Switch checked={draft.active} onCheckedChange={(active) => patch({ active })} /> Formulário ativo</label>

          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium">Campos</h3>
            <Button size="sm" variant="outline" onClick={() => patch({ fields: [...draft.fields, { key: fieldKey(), label: "Novo campo", type: "text", required: false }] })}><Plus /> Campo</Button>
          </div>
          <div className="grid gap-2">
            {draft.fields.map((field, index) => {
              const fixed = field.key === "titulo";
              return (
                <div key={field.key} className="grid gap-2 rounded-lg border border-border bg-background/40 p-3">
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto_auto] sm:items-center">
                    <Input value={field.label} onChange={(event) => patchField(index, { label: event.target.value })} aria-label="Rótulo do campo" />
                    <Select value={field.type} disabled={fixed} onValueChange={(value) => patchField(index, { type: value as FieldType })}>
                      <SelectTrigger className="w-full" aria-label="Tipo do campo"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(FIELD_LABELS) as FieldType[]).map((type) => <SelectItem key={type} value={type}>{FIELD_LABELS[type]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={field.required} disabled={fixed} onChange={(event) => patchField(index, { required: event.target.checked })} /> Obrigatório</label>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" aria-label="Subir campo" disabled={index < 2} onClick={() => patch({ fields: draft.fields.map((item, i, all) => (i === index - 1 ? all[index] : i === index ? all[index - 1] : item)) })}><ArrowUp /></Button>
                      <Button size="icon" variant="ghost" aria-label="Remover campo" disabled={fixed} onClick={() => patch({ fields: draft.fields.filter((_, i) => i !== index) })}><X /></Button>
                    </div>
                  </div>
                  {field.type === "select" ? <Input value={field.options ?? ""} onChange={(event) => patchField(index, { options: event.target.value })} placeholder="Opções separadas por vírgula" aria-label="Opções" /> : null}
                  {field.type === "feedback" ? <p className="text-xs text-muted-foreground">Opções vêm do catálogo em Gestão → Tipos de feedback.</p> : null}
                  {field.type === "gallery" ? <p className="text-xs text-muted-foreground">Permite selecionar várias imagens (até 8).</p> : null}
                  {field.type === "appointment" ? <p className="text-xs text-muted-foreground">No máximo um por formulário. Data, duração, local e participantes.</p> : null}
                  {fixed ? <p className="text-xs text-muted-foreground">Vira o título da tarefa.</p> : null}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : null}{draft.id ? "Salvar formulário" : "Criar formulário"}</Button>
            {draft.id && !inQuick ? <Button variant="outline" onClick={addToQuick}><Zap /> Adicionar ao atalho rápido</Button> : null}
            {draft.id ? <Button variant="ghost" className="ml-auto text-destructive" onClick={remove}><Trash /> Excluir</Button> : null}
          </div>
        </section>

        <section className="surface grid content-start gap-4 p-5" aria-label="Pré-visualização">
          <p className="label">Pré-visualização</p>
          <div>
            <p className="label text-primary">{spaceName(draft.spaceId)}</p>
            <h3 className="mt-1 text-lg font-medium">{draft.name}</h3>
            {draft.description ? <p className="mt-1 text-sm text-muted-foreground">{draft.description}</p> : null}
          </div>
          <div className="pointer-events-none grid gap-4 opacity-90">
            {draft.fields.map((field) => <FieldInput key={field.key} field={field} value="" clients={[{ id: "x", name: "Cliente de exemplo" }]} feedbackTypes={feedbackTypes} onChange={() => {}} disabled />)}
          </div>
        </section>
      </div>
    </div>
  );
}
