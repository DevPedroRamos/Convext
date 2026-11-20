"use client";

import { Ellipsis, FileText, GripVertical, LayoutGrid, List, Pencil, Plus, Trash, UserCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { financeRequest } from "@/components/finance/api";
import { DataTable, type FinanceColumn } from "@/components/finance/data-table";
import { ConvertLeadDialog, LeadDialog } from "@/components/finance/lead-dialog";
import { nativeSelectClass, StatusBadge, type Tone } from "@/components/finance/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kanban, KanbanBoard, KanbanColumn, KanbanColumnContent, KanbanItem, KanbanItemHandle, KanbanOverlay } from "@/components/ui/kanban";
import { formatDate } from "@/lib/finance/dates";
import { leadSourceLabels, leadStatusLabels } from "@/lib/finance/labels";
import { formatCents } from "@/lib/finance/money";
import type { Lead, LeadStatus, ProfileRef } from "@/lib/finance/types";

const BOARD: LeadStatus[] = ["new", "contacted", "qualified", "proposal", "won", "lost"];

export const leadTone: Record<LeadStatus, Tone> = {
  new: "info",
  contacted: "neutral",
  qualified: "warning",
  proposal: "warning",
  won: "positive",
  lost: "negative",
  archived: "neutral",
};

function group(leads: Lead[]) {
  const columns = Object.fromEntries(BOARD.map((status) => [status, [] as Lead[]])) as Record<LeadStatus, Lead[]>;
  for (const lead of leads) columns[lead.status]?.push(lead);
  return columns;
}

type Props = { leads: Lead[]; people: ProfileRef[]; clients: { id: string; name: string }[]; currentUserId: string; canDelete: boolean };

export function LeadsBoard({ leads, people, clients, currentUserId, canDelete }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"board" | "list">("board");
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [converting, setConverting] = useState<Lead | null>(null);
  const [override, setOverride] = useState<Record<LeadStatus, Lead[]> | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (!showArchived && lead.status === "archived") return false;
      if (owner === "me" && lead.assigneeId !== currentUserId) return false;
      if (owner === "none" && lead.assigneeId) return false;
      if (!term) return true;
      return [lead.name, lead.company, lead.email, lead.phone, lead.assigneeName].filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [currentUserId, leads, owner, query, showArchived]);

  const columns = override ?? group(filtered);

  function openForm(lead: Lead | null) {
    setEditing(lead);
    setFormOpen(true);
  }

  async function move(id: string, status: LeadStatus) {
    const done = await financeRequest(`/api/finance/leads/${id}`, "PATCH", { status });
    setOverride(null);
    if (done) router.refresh();
  }

  async function remove(lead: Lead) {
    if (!window.confirm(`Excluir o lead ${lead.name}?`)) return;
    if (await financeRequest(`/api/finance/leads/${lead.id}`, "DELETE", undefined, "Lead excluído.")) router.refresh();
  }

  const actions = (lead: Lead) => (
    <LeadActions lead={lead} canDelete={canDelete} onEdit={() => openForm(lead)} onConvert={() => setConverting(lead)} onMove={(status) => move(lead.id, status)} onDelete={() => remove(lead)} />
  );

  const listColumns: FinanceColumn<Lead>[] = [
    {
      accessorKey: "name",
      header: "Lead",
      cell: ({ row }) => (
        <button type="button" className="text-left" onClick={() => openForm(row.original)}>
          <span className="font-medium hover:text-primary">{row.original.name}</span>
          {row.original.company ? <span className="block text-xs text-muted-foreground">{row.original.company}</span> : null}
        </button>
      ),
    },
    { accessorKey: "status", header: "Etapa", cell: ({ row }) => <StatusBadge label={leadStatusLabels[row.original.status]} tone={leadTone[row.original.status]} /> },
    { accessorKey: "source", header: "Origem", cell: ({ row }) => leadSourceLabels[row.original.source] },
    { accessorKey: "assigneeName", header: "Responsável", cell: ({ row }) => row.original.assigneeName ?? <span className="text-muted-foreground">—</span> },
    { accessorKey: "estimatedValueCents", header: "Valor est.", className: "text-right tabular-nums", cell: ({ row }) => (row.original.estimatedValueCents == null ? "—" : formatCents(row.original.estimatedValueCents)) },
    { accessorKey: "createdAt", header: "Entrada", className: "tabular-nums", cell: ({ row }) => formatDate(row.original.createdAt) },
    { id: "actions", header: () => <span className="sr-only">Ações</span>, className: "text-right", enableSorting: false, cell: ({ row }) => actions(row.original) },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar lead, empresa ou telefone" className="w-full sm:w-72" aria-label="Buscar leads" />
        <select className={`${nativeSelectClass} w-auto`} value={owner} onChange={(event) => setOwner(event.target.value)} aria-label="Responsável">
          <option value="all">Todos os responsáveis</option>
          <option value="me">Meus leads</option>
          <option value="none">Sem responsável</option>
        </select>
        <Button type="button" variant={showArchived ? "default" : "outline"} onClick={() => setShowArchived((value) => !value)}>
          Arquivados
        </Button>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" size="icon" aria-label="Quadro" aria-pressed={view === "board"} onClick={() => setView("board")} className={view === "board" ? "border-primary" : undefined}>
            <LayoutGrid />
          </Button>
          <Button type="button" variant="outline" size="icon" aria-label="Lista" aria-pressed={view === "list"} onClick={() => setView("list")} className={view === "list" ? "border-primary" : undefined}>
            <List />
          </Button>
          <Button type="button" onClick={() => openForm(null)}>
            <Plus /> Novo lead
          </Button>
        </div>
      </div>

      {view === "list" || showArchived ? (
        <DataTable data={filtered} columns={listColumns} empty="Nenhum lead encontrado." initialSort={[{ id: "createdAt", desc: true }]} />
      ) : (
        <Kanban
          value={columns}
          onValueChange={(value) => setOverride(value as Record<LeadStatus, Lead[]>)}
          getItemValue={(lead) => lead.id}
          restoreOnCancel
          onValueCommit={(_value, meta) => {
            if (meta.kind !== "item" || meta.activeContainer === meta.overContainer) {
              setOverride(null);
              return;
            }
            move(String(meta.event.active.id), meta.overContainer as LeadStatus);
          }}
        >
          <KanbanBoard className="grid-cols-1 md:grid-cols-3 2xl:grid-cols-6">
            {BOARD.map((status) => (
              <KanbanColumn key={status} value={status} disabled>
                <div className="surface mb-3 flex items-center justify-between gap-2 p-3">
                  <span className="text-sm font-semibold">{leadStatusLabels[status]}</span>
                  <Badge variant="outline">{columns[status].length}</Badge>
                </div>
                <KanbanColumnContent value={status} className="min-h-24">
                  {columns[status].map((lead) => (
                    <KanbanItem key={lead.id} value={lead.id}>
                      <div className="surface grid gap-2 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <button type="button" className="min-w-0 text-left" onClick={() => openForm(lead)}>
                            <p className="truncate text-sm font-medium">{lead.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{lead.company || lead.phone || lead.email || "—"}</p>
                          </button>
                          <div className="flex items-center">
                            {actions(lead)}
                            <KanbanItemHandle className="text-muted-foreground" aria-label="Arrastar">
                              <GripVertical className="size-4" />
                            </KanbanItemHandle>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{leadSourceLabels[lead.source]} · {formatDate(lead.createdAt)}</span>
                          {lead.estimatedValueCents ? <span className="tabular-nums text-foreground">{formatCents(lead.estimatedValueCents)}</span> : null}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{lead.assigneeName ? `Resp.: ${lead.assigneeName}` : "Sem responsável"}</p>
                      </div>
                    </KanbanItem>
                  ))}
                </KanbanColumnContent>
              </KanbanColumn>
            ))}
          </KanbanBoard>
          <KanbanOverlay />
        </Kanban>
      )}

      <p className="text-xs text-muted-foreground">{filtered.length} de {leads.length} leads</p>

      <LeadDialog open={formOpen} onOpenChange={setFormOpen} lead={editing} people={people} onSaved={() => router.refresh()} />
      <ConvertLeadDialog lead={converting} clients={clients} onOpenChange={(open) => !open && setConverting(null)} onConverted={() => router.refresh()} />
    </div>
  );
}

function LeadActions({ lead, canDelete, onEdit, onConvert, onMove, onDelete }: { lead: Lead; canDelete: boolean; onEdit: () => void; onConvert: () => void; onMove: (status: LeadStatus) => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="size-7" aria-label={`Ações de ${lead.name}`}>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuItem onClick={onEdit}><Pencil /> Editar</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/app/financeiro/comercial?lead=${lead.id}`}><FileText /> Criar proposta</Link>
        </DropdownMenuItem>
        {!lead.convertedCustomerId ? <DropdownMenuItem onClick={onConvert}><UserCheck /> Converter em cliente</DropdownMenuItem> : null}
        {lead.status !== "lost" ? <DropdownMenuItem onClick={() => onMove("lost")}><XCircle /> Marcar como perdido</DropdownMenuItem> : null}
        {lead.status !== "archived" ? <DropdownMenuItem onClick={() => onMove("archived")}>Arquivar</DropdownMenuItem> : <DropdownMenuItem onClick={() => onMove("new")}>Desarquivar</DropdownMenuItem>}
        {canDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}><Trash /> Excluir</DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
