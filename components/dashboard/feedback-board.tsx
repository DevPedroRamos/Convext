"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FeedbackDeleteButton } from "@/components/dashboard/feedback-delete-button";
import { FeedbackForm } from "@/components/forms/feedback-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { ClientRecord } from "@/lib/clients";
import { demandKindLabel, demandPriorityLabel, demandStatusLabel, formatDueOn } from "@/lib/demand-labels";
import type { FeedbackRecord } from "@/lib/demands";

const ALL = "all";
const NONE = "none";

export function FeedbackBoard({
  feedbacks,
  clients,
  canDelete,
}: {
  feedbacks: FeedbackRecord[];
  clients: ClientRecord[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [responsible, setResponsible] = useState(ALL);
  const [company, setCompany] = useState(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FeedbackRecord | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const responsibles = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of feedbacks) {
      if (item.responsibleId) map.set(item.responsibleId, item.responsibleName || "Sem nome");
    }
    return [...map.entries()].sort((left, right) => left[1].localeCompare(right[1], "pt-BR"));
  }, [feedbacks]);

  const companies = useMemo(() => {
    return [...new Set(feedbacks.map((item) => item.clientCompany).filter(Boolean))].sort((left, right) => left.localeCompare(right, "pt-BR"));
  }, [feedbacks]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return feedbacks.filter((item) => {
      if (responsible === NONE && item.responsibleId) return false;
      if (responsible !== ALL && responsible !== NONE && item.responsibleId !== responsible) return false;
      if (company !== ALL && item.clientCompany !== company) return false;
      if (!term) return true;
      const haystack = [item.clientName, item.clientWhatsapp, item.clientCompany, item.description, item.responsibleName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [company, feedbacks, query, responsible]);

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const response = await fetch(`/api/feedback/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: editDescription }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      toast.error(payload.error || "Não foi possível salvar.");
      return;
    }
    toast.success("Descrição atualizada.");
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-primary">Feedback</p>
          <h2 className="mt-2 font-display text-h2">Demandas dos clientes.</h2>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setCreateOpen(true)}>
          <Plus /> Cadastrar Feedback
        </Button>
      </div>

      {feedbacks.length === 0 ? (
        <div className="surface p-8 text-muted-foreground">Nenhum feedback cadastrado.</div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por cliente, número, empresa, responsável ou descrição" />
            <Select value={responsible} onValueChange={setResponsible}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Responsável" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os responsáveis</SelectItem>
                <SelectItem value={NONE}>Sem responsável</SelectItem>
                {responsibles.map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas as empresas</SelectItem>
                {companies.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="surface p-8 text-muted-foreground">Nenhum feedback encontrado.</div>
          ) : (
            <div className="surface overflow-hidden p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[1%]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">{item.clientName}</p>
                        <p className="text-xs text-muted-foreground">{item.clientCompany}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.responsibleName || "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{demandKindLabel(item.kind)}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{demandStatusLabel(item.status)}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{demandPriorityLabel(item.priority)}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{formatDueOn(item.dueOn)}</TableCell>
                      <TableCell className="max-w-md whitespace-normal text-muted-foreground">{item.description}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditing(item);
                              setEditDescription(item.description);
                            }}
                          >
                            Editar
                          </Button>
                          {canDelete ? <FeedbackDeleteButton id={item.id} label={item.clientName} /> : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{filtered.length} de {feedbacks.length} feedbacks</p>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg py-8">
          <DialogHeader>
            <DialogTitle>Cadastrar Feedback</DialogTitle>
            <DialogDescription>A demanda fica ligada ao cliente e herda o responsável atual.</DialogDescription>
          </DialogHeader>
          <FeedbackForm
            clients={clients}
            onCancel={() => setCreateOpen(false)}
            onSuccess={() => {
              setCreateOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar descrição</DialogTitle>
            <DialogDescription>
              {editing ? `${editing.clientName} · ${demandKindLabel(editing.kind)}` : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} rows={4} />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button disabled={saving} onClick={saveEdit} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
