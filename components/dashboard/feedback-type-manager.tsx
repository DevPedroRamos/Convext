"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { FeedbackType } from "@/lib/feedback-types";

export function FeedbackTypeManager({ types }: { types: FeedbackType[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FeedbackType | null>(null);
  const [name, setName] = useState("");
  const [solution, setSolution] = useState("");
  const [loading, setLoading] = useState(false);

  function startCreate() {
    setEditing(null);
    setName("");
    setSolution("");
    setOpen(true);
  }

  function startEdit(type: FeedbackType) {
    setEditing(type);
    setName(type.name);
    setSolution(type.solution);
    setOpen(true);
  }

  async function save() {
    setLoading(true);
    const response = await fetch(editing ? `/api/feedback-types/${editing.id}` : "/api/feedback-types", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, solution }),
    });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      toast.error(payload.error || "Não foi possível salvar o tipo.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function remove(type: FeedbackType) {
    if (!window.confirm(`Excluir o tipo “${type.name}”?`)) return;
    const response = await fetch(`/api/feedback-types/${type.id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      toast.error(payload.error || "Não foi possível excluir o tipo.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Cada tipo leva uma solução padrão que aparece ao cadastrar o feedback.</p>
        <Button size="sm" onClick={startCreate}><Plus /> Novo tipo</Button>
      </div>
      <div className="grid gap-2">
        {types.map((type) => (
          <div key={type.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <div className="min-w-0">
              <p className="font-medium">{type.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{type.solution.trim() || "Sem solução cadastrada."}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => startEdit(type)} aria-label={`Editar ${type.name}`}>
                <Pencil className="size-3.5" />
              </button>
              <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => remove(type)} aria-label={`Excluir ${type.name}`}>
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="panel">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar tipo" : "Novo tipo"}</SheetTitle>
            <SheetDescription>Nome visível no cadastro de feedback e a solução sugerida para o time.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="feedback-type-name">Nome</Label>
              <Input id="feedback-type-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="renda baixa" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feedback-type-solution">Solução</Label>
              <Textarea id="feedback-type-solution" rows={6} value={solution} onChange={(event) => setSolution(event.target.value)} placeholder="O que o time deve fazer neste tipo." />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="button" disabled={loading || name.trim().length < 2} onClick={save}>
                {editing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
