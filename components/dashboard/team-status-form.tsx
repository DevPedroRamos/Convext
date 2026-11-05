"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { teamStatusIcon, teamStatusIconNames, type TeamStatus } from "@/lib/team-status-icons";
import { cn } from "@/lib/utils";

export function TeamStatusManager({ statuses }: { statuses: TeamStatus[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TeamStatus | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(teamStatusIconNames[0]);
  const [loading, setLoading] = useState(false);

  function startCreate() {
    setEditing(null);
    setName("");
    setIcon(teamStatusIconNames[0]);
    setOpen(true);
  }

  function startEdit(status: TeamStatus) {
    setEditing(status);
    setName(status.name);
    setIcon(status.icon);
    setOpen(true);
  }

  async function save() {
    setLoading(true);
    const response = await fetch(editing ? `/api/team-statuses/${editing.id}` : "/api/team-statuses", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, icon }),
    });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      toast.error(payload.error || "Não foi possível salvar o status.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function remove(status: TeamStatus) {
    const response = await fetch(`/api/team-statuses/${status.id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      toast.error(payload.error || "Não foi possível excluir o status.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Status que cada pessoa escolhe no menu.</p>
        <Button size="sm" onClick={startCreate}><Plus /> Novo status</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => {
          const Icon = teamStatusIcon(status.icon);
          return (
            <div key={status.id} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm">
              <Icon className="size-3.5" />
              <span>{status.name}</span>
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => startEdit(status)} aria-label={`Editar ${status.name}`}>
                <Pencil className="size-3.5" />
              </button>
              <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => remove(status)} aria-label={`Excluir ${status.name}`}>
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md py-8">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar status" : "Novo status"}</DialogTitle>
            <DialogDescription>Nome e ícone visíveis no perfil e na equipe.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status-name">Nome</Label>
              <Input id="status-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Modo foco" />
            </div>
            <div className="grid gap-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-5 gap-2">
                {teamStatusIconNames.map((item) => {
                  const Icon = teamStatusIcon(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setIcon(item)}
                      className={cn(
                        "grid size-10 place-items-center rounded-lg border",
                        icon === item ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                      )}
                      aria-label={item}
                    >
                      <Icon className="size-4" />
                    </button>
                  );
                })}
              </div>
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
