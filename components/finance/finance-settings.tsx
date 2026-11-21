"use client";

import { Check, Loader2, Pencil, Plus, Trash, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { financeRequest } from "@/components/finance/api";
import { Field, Section, StatusBadge } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ExpenseCategory, FinanceSettings } from "@/lib/finance/types";

export function FinanceSettingsForm({ settings }: { settings: FinanceSettings }) {
  const router = useRouter();
  const [dueDay, setDueDay] = useState(settings.defaultDueDay);
  const [companyName, setCompanyName] = useState(settings.companyName ?? "");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const done = await financeRequest("/api/finance/settings", "PUT", { defaultDueDay: dueDay, companyName }, "Configurações salvas.");
    setLoading(false);
    if (done) router.refresh();
  }

  return (
    <Section title="Padrões">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <Field label="Empresa (razão social)" className="sm:col-span-2">
          <Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
        </Field>
        <Field label="Dia de vencimento padrão" hint="Sugerido ao aceitar propostas.">
          <Input type="number" min={1} max={31} value={dueDay} onChange={(event) => setDueDay(Number(event.target.value))} required />
        </Field>
        <div className="sm:col-span-3">
          <Button disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : null}Salvar</Button>
        </div>
      </form>
    </Section>
  );
}

export function ExpenseCategoriesManager({ categories }: { categories: ExpenseCategory[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  async function save(id: string | null, values: { name: string; active: boolean }, success: string) {
    if (await financeRequest(id ? `/api/finance/expense-categories/${id}` : "/api/finance/expense-categories", id ? "PUT" : "POST", values, success)) {
      setName("");
      setEditing(null);
      router.refresh();
    }
  }

  async function remove(category: ExpenseCategory) {
    if (!window.confirm(`Excluir a categoria ${category.name}? As despesas ficam sem categoria.`)) return;
    if (await financeRequest(`/api/finance/expense-categories/${category.id}`, "DELETE", undefined, "Categoria excluída.")) router.refresh();
  }

  return (
    <Section title="Categorias de despesa">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim().length >= 2) save(null, { name, active: true }, "Categoria criada.");
        }}
      >
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nova categoria" aria-label="Nova categoria" />
        <Button><Plus /> Adicionar</Button>
      </form>
      <div className="grid gap-2">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
            {editing?.id === category.id ? (
              <>
                <Input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className="h-8" aria-label="Nome da categoria" autoFocus />
                <Button size="icon" variant="ghost" aria-label="Salvar" onClick={() => save(category.id, { name: editing.name, active: category.active }, "Categoria renomeada.")}><Check /></Button>
                <Button size="icon" variant="ghost" aria-label="Cancelar" onClick={() => setEditing(null)}><X /></Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{category.name}</span>
                {!category.active ? <StatusBadge label="Inativa" /> : null}
                <Switch checked={category.active} onCheckedChange={(active) => save(category.id, { name: category.name, active }, active ? "Categoria ativada." : "Categoria desativada.")} aria-label={`Ativa: ${category.name}`} />
                <Button size="icon" variant="ghost" aria-label={`Renomear ${category.name}`} onClick={() => setEditing({ id: category.id, name: category.name })}><Pencil /></Button>
                <Button size="icon" variant="ghost" aria-label={`Excluir ${category.name}`} onClick={() => remove(category)}><Trash /></Button>
              </>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
