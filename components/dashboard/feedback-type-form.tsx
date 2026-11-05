"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FeedbackType } from "@/lib/feedback-types";

export function FeedbackTypeManager({ types }: { types: FeedbackType[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FeedbackType | null>(null);
  const [name, setName] = useState("");
  const [solution, setSolution] = useState("");
  const [spawnsCreator, setSpawnsCreator] = useState(false);
  const [loading, setLoading] = useState(false);

  function startCreate() {
    setEditing(null);
    setName("");
    setSolution("");
    setSpawnsCreator(false);
    setOpen(true);
  }

  function startEdit(type: FeedbackType) {
    setEditing(type);
    setName(type.name);
    setSolution(type.solution);
    setSpawnsCreator(type.spawnsCreator);
    setOpen(true);
  }

  async function save() {
    setLoading(true);
    const response = await fetch(editing ? `/api/feedback-types/${editing.id}` : "/api/feedback-types", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, solution, spawnsCreator }),
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
        <p className="text-sm text-muted-foreground">Tipos do cadastro de Feedback e a solução que acompanha cada um.</p>
        <Button size="sm" onClick={startCreate}><Plus /> Novo tipo</Button>
      </div>
      <div className="grid gap-2">
        {types.map((type) => (
          <div key={type.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
            <div className="min-w-0">
              <p className="font-medium">{type.name}</p>
              <p className="text-sm text-muted-foreground">{type.solution || "Sem solução cadastrada"}</p>
              {type.spawnsCreator ? <p className="mt-1 text-xs text-primary">Gera demanda de criativo</p> : null}
            </div>
            <div className="flex gap-1">
              <button type="button" className="p-1 text-muted-foreground hover:text-foreground" onClick={() => startEdit(type)} aria-label={`Editar ${type.name}`}>
                <Pencil className="size-3.5" />
              </button>
              <button type="button" className="p-1 text-muted-foreground hover:text-destructive" onClick={() => remove(type)} aria-label={`Excluir ${type.name}`}>
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md py-8">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar tipo" : "Novo tipo"}</DialogTitle>
            <DialogDescription>Nome, solução e se o tipo cria demanda para o designer.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type-name">Nome</Label>
              <Input id="type-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Campanha nova" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type-solution">Solução</Label>
              <Textarea id="type-solution" value={solution} onChange={(event) => setSolution(event.target.value)} rows={4} placeholder="O que o time deve fazer neste tipo" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Gera demanda de criativo</p>
                <p className="text-xs text-muted-foreground">Ao cadastrar o feedback, pede briefing e creator.</p>
              </div>
              <Switch checked={spawnsCreator} onCheckedChange={setSpawnsCreator} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="button" disabled={loading || name.trim().length < 2} onClick={save}>
                {editing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
