"use client";

import { ArrowUp, Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { spacesRequest } from "@/components/spaces/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AppRole } from "@/lib/access";
import { roleLabels, SPACE_ROLES } from "@/lib/spaces/roles";
import { type QuickAction, type Space, type SpaceForm, systemActionLabels } from "@/lib/spaces/types";

type Row = { id?: string; label: string; kind: "form" | "system"; formId: string | null; systemAction: QuickAction["systemAction"]; audienceRoles: AppRole[] };

export function QuickActionsEditor({ actions, forms, spaces }: { actions: QuickAction[]; forms: SpaceForm[]; spaces: Space[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(actions.map((action) => ({ id: action.id, label: action.label, kind: action.kind, formId: action.formId, systemAction: action.systemAction, audienceRoles: [...action.audienceRoles] })));
  const [adding, setAdding] = useState("");
  const [saving, setSaving] = useState(false);
  const formById = new Map(forms.map((form) => [form.id, form]));
  const spaceName = (id: string) => spaces.find((space) => space.id === id)?.name ?? "—";
  const used = new Set(rows.map((row) => row.formId ?? `system:${row.systemAction}`));
  const addable = [
    ...forms.filter((form) => !used.has(form.id)).map((form) => ({ value: form.id, label: `${form.name} · ${spaceName(form.spaceId)}` })),
    ...(["case", "client", "lead"] as const).filter((action) => !used.has(`system:${action}`)).map((action) => ({ value: `system:${action}`, label: `${systemActionLabels[action]} · ação do sistema` })),
  ];

  function toggle(index: number, role: AppRole, on: boolean) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, audienceRoles: on ? [...row.audienceRoles, role] : row.audienceRoles.filter((item) => item !== role) } : row)));
  }
  function add() {
    if (!adding) return;
    if (adding.startsWith("system:")) {
      const action = adding.slice(7) as NonNullable<QuickAction["systemAction"]>;
      setRows((current) => [...current, { label: systemActionLabels[action], kind: "system", formId: null, systemAction: action, audienceRoles: ["admin"] }]);
    } else {
      const form = formById.get(adding)!;
      setRows((current) => [...current, { label: form.name, kind: "form", formId: form.id, systemAction: null, audienceRoles: [...form.audienceRoles] }]);
    }
    setAdding("");
  }
  async function save() {
    setSaving(true);
    const done = await spacesRequest("/api/spaces/quick-actions", "PUT", { actions: rows }, "Atalho rápido salvo.");
    setSaving(false);
    if (done) router.refresh();
  }

  return (
    <section className="surface grid gap-4 p-5">
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 text-left font-normal">Atalho</th>
              {SPACE_ROLES.map((role) => <th key={role} className="py-2 font-normal">{roleLabels[role]}</th>)}
              <th className="py-2"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const form = row.formId ? formById.get(row.formId) : null;
              return (
                <tr key={row.id ?? `${row.formId}-${row.systemAction}`} className="border-b border-border/60">
                  <td className="py-2.5">
                    <p className="font-medium">{row.label}</p>
                    <p className="text-xs text-muted-foreground">{form ? `Formulário · ${spaceName(form.spaceId)}` : "Ação do sistema"}</p>
                  </td>
                  {SPACE_ROLES.map((role) => (
                    <td key={role} className="py-2.5 text-center">
                      <input type="checkbox" aria-label={`${row.label} para ${roleLabels[role]}`} checked={row.audienceRoles.includes(role)} onChange={(event) => toggle(index, role, event.target.checked)} />
                    </td>
                  ))}
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <Button size="icon" variant="ghost" aria-label="Subir" disabled={index === 0} onClick={() => setRows((current) => current.map((item, i, all) => (i === index - 1 ? all[index] : i === index ? all[index - 1] : item)))}><ArrowUp /></Button>
                    <Button size="icon" variant="ghost" aria-label="Remover" onClick={() => setRows((current) => current.filter((_, i) => i !== index))}><X /></Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={adding || "none"} onValueChange={(value) => setAdding(value === "none" ? "" : value)}>
          <SelectTrigger className="w-full sm:w-80" aria-label="Adicionar atalho"><SelectValue placeholder="Adicionar formulário ou ação…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Adicionar formulário ou ação…</SelectItem>
            {addable.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={add} disabled={!adding}><Plus /> Adicionar</Button>
        <Button className="ml-auto" onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : null}Salvar atalhos</Button>
      </div>
      <p className="text-xs text-muted-foreground">Cada pessoa vê no botão laranja só os atalhos marcados para a role dela. Um formulário no atalho só aparece para quem também pode enviá-lo.</p>
    </section>
  );
}
