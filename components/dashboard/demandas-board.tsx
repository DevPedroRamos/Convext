"use client";

import { GripVertical, LayoutGrid, List, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DemandDetailSheet } from "@/components/dashboard/demand-detail-sheet";
import { CreatorDemandForm, type CreatorDemandPrefill } from "@/components/forms/creator-demand-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
} from "@/components/ui/kanban";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ClientRecord } from "@/lib/clients";
import type { DemandFileRecord } from "@/lib/demand-files";
import { demandKindLabel, demandPriorityLabel, demandStatusLabel, formatDueOn } from "@/lib/demand-labels";
import type { DemandRecord } from "@/lib/demands";
import type { CreatorOption } from "@/lib/profile";
import { demandKinds, demandPriorities, demandStatuses, type DemandKind, type DemandPriority, type DemandStatus } from "@/lib/validations/demand";

const ALL = "all";
const NONE = "none";

type DueFilter = "all" | "overdue" | "week" | "none";

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function emptyColumns(): Record<DemandStatus, DemandRecord[]> {
  return { new: [], briefing: [], in_progress: [], completed: [] };
}

function groupColumns(records: DemandRecord[]): Record<DemandStatus, DemandRecord[]> {
  const next = emptyColumns();
  for (const item of records) next[item.status].push(item);
  return next;
}

export function DemandasBoard({
  demands,
  clients,
  creators,
  currentUserId,
  canFilterResponsible,
  canCreate,
  isAdmin,
  isOperations,
}: {
  demands: DemandRecord[];
  clients: ClientRecord[];
  creators: CreatorOption[];
  currentUserId?: string | null;
  canFilterResponsible: boolean;
  canCreate: boolean;
  isAdmin: boolean;
  isOperations: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [due, setDue] = useState<DueFilter>("all");
  const [responsible, setResponsible] = useState(ALL);
  const [clientId, setClientId] = useState(ALL);
  const [selected, setSelected] = useState<DemandRecord | null>(null);
  const [columnOverride, setColumnOverride] = useState<Record<DemandStatus, DemandRecord[]> | null>(null);
  const [createPrefill, setCreatePrefill] = useState<CreatorDemandPrefill | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const responsibles = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of demands) {
      if (item.responsibleId) map.set(item.responsibleId, item.responsibleName || "Sem nome");
    }
    return [...map.entries()].sort((left, right) => left[1].localeCompare(right[1], "pt-BR"));
  }, [demands]);

  const clientOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of demands) map.set(item.clientId, item.clientName);
    for (const client of clients) map.set(client.id, client.name);
    return [...map.entries()].sort((left, right) => left[1].localeCompare(right[1], "pt-BR"));
  }, [clients, demands]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const today = todayIso();
    const weekEnd = addDays(today, 6);
    return demands.filter((item) => {
      if (kind !== ALL && item.kind !== kind) return false;
      if (priority !== ALL && item.priority !== priority) return false;
      if (clientId !== ALL && item.clientId !== clientId) return false;
      if (canFilterResponsible && responsible === NONE && item.responsibleId) return false;
      if (canFilterResponsible && responsible !== ALL && responsible !== NONE && item.responsibleId !== responsible) return false;
      if (due === "none" && item.dueOn) return false;
      if (due === "overdue" && (!item.dueOn || item.dueOn >= today)) return false;
      if (due === "week" && (!item.dueOn || item.dueOn < today || item.dueOn > weekEnd)) return false;
      if (!term) return true;
      const haystack = [item.clientName, item.description, item.responsibleName, item.clientCompany, item.title, item.briefing]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [canFilterResponsible, clientId, demands, due, kind, priority, query, responsible]);

  const grouped = useMemo(() => groupColumns(filtered), [filtered]);
  const columns = columnOverride ?? grouped;

  async function persistStatus(id: string, status: DemandStatus) {
    const response = await fetch(`/api/demandas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setColumnOverride(null);
      toast.error(payload.error || "Não foi possível mover a demanda.");
      return;
    }
    toast.success("Status atualizado.");
    setColumnOverride(null);
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-primary">Demandas</p>
          <h2 className="mt-2 font-display text-h2">Quadro de trabalho.</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreate ? (
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
              setCreatePrefill(null);
              setCreateOpen(true);
            }}>
              <Plus /> Cadastrar demanda
            </Button>
          ) : null}
          <Button variant={view === "kanban" ? "default" : "outline"} onClick={() => setView("kanban")}>
            <LayoutGrid /> Kanban
          </Button>
          <Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>
            <List /> Lista
          </Button>
        </div>
      </div>

      <div className={`grid gap-3 ${canFilterResponsible ? "xl:grid-cols-[minmax(0,1fr)_180px_160px_160px_180px_220px]" : "xl:grid-cols-[minmax(0,1fr)_180px_160px_160px_180px]"}`}>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por cliente, nome, briefing ou responsável" />
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Cliente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os clientes</SelectItem>
            {clientOptions.map(([id, name]) => (
              <SelectItem key={id} value={id}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os tipos</SelectItem>
            {demandKinds.map((item) => (
              <SelectItem key={item} value={item}>{demandKindLabel(item as DemandKind)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as prioridades</SelectItem>
            {demandPriorities.map((item) => (
              <SelectItem key={item} value={item}>{demandPriorityLabel(item as DemandPriority)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={due} onValueChange={(value) => setDue(value as DueFilter)}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Prazo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os prazos</SelectItem>
            <SelectItem value="overdue">Atrasadas</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="none">Sem prazo</SelectItem>
          </SelectContent>
        </Select>
        {canFilterResponsible ? (
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
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="surface p-8 text-muted-foreground">Nenhuma demanda encontrada.</div>
      ) : view === "list" ? (
        <DemandList records={filtered} onOpen={setSelected} />
      ) : (
        <Kanban
          value={columns}
          onValueChange={(value) => setColumnOverride(value as Record<DemandStatus, DemandRecord[]>)}
          getItemValue={(item) => item.id}
          restoreOnCancel
          onValueCommit={(_value, meta) => {
            if (meta.kind !== "item" || meta.activeContainer === meta.overContainer) {
              setColumnOverride(null);
              return;
            }
            persistStatus(String(meta.event.active.id), meta.overContainer as DemandStatus);
          }}
        >
          <KanbanBoard className="grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
            {demandStatuses.map((status) => (
              <KanbanColumn key={status} value={status} disabled>
                <div className="surface mb-3 flex items-center justify-between gap-2 p-3">
                  <span className="text-sm font-semibold">{demandStatusLabel(status)}</span>
                  <Badge variant="outline">{columns[status].length}</Badge>
                </div>
                <KanbanColumnContent value={status}>
                  {columns[status].map((item) => (
                    <DemandCard key={item.id} item={item} onOpen={setSelected} />
                  ))}
                </KanbanColumnContent>
              </KanbanColumn>
            ))}
          </KanbanBoard>
          <KanbanOverlay />
        </Kanban>
      )}

      <p className="text-xs text-muted-foreground">{filtered.length} de {demands.length} demandas</p>
      <DemandDetailSheet
        demand={selected}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        isOperations={isOperations}
        onClose={() => setSelected(null)}
        onRequestCreative={(demand) => {
          setSelected(null);
          setCreatePrefill({
            clientId: demand.clientId,
            sourceDemandId: demand.id,
            lockClient: true,
            endpoint: `/api/demandas/${demand.id}/criativo`,
          });
          setCreateOpen(true);
        }}
        onReuseBriefing={(demand, files: DemandFileRecord[]) => {
          setSelected(null);
          setCreatePrefill({
            clientId: demand.clientId,
            title: demand.title || "",
            description: demand.description,
            briefing: demand.briefing || "",
            creatorId: demand.responsibleId || "",
            referenceFiles: files,
          });
          setCreateOpen(true);
        }}
      />
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open);
        if (!open) setCreatePrefill(null);
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl py-8">
          <DialogHeader>
            <DialogTitle>{createPrefill?.endpoint ? "Solicitar criativo" : createPrefill ? "Reaproveitar briefing" : "Cadastrar demanda"}</DialogTitle>
            <DialogDescription>
              {createPrefill?.endpoint
                ? "Cria uma demanda de criativo ligada a este feedback."
                : "Nome, cliente, creator, briefing e referências."}
            </DialogDescription>
          </DialogHeader>
          <CreatorDemandForm
            key={`${createPrefill?.sourceDemandId || "new"}-${createPrefill?.title || ""}`}
            clients={clients}
            creators={creators}
            prefill={createPrefill}
            onCancel={() => {
              setCreateOpen(false);
              setCreatePrefill(null);
            }}
            onSuccess={() => {
              setCreateOpen(false);
              setCreatePrefill(null);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function isOverdue(item: DemandRecord) {
  return Boolean(item.dueOn && item.dueOn < todayIso() && item.status !== "completed");
}

function DemandCard({ item, onOpen }: { item: DemandRecord; onOpen: (item: DemandRecord) => void }) {
  const overdue = isOverdue(item);
  const urgent = item.priority === "high";

  return (
    <KanbanItem value={item.id}>
      <div
        className={`surface grid gap-3 p-3 ${
          overdue ? "border-destructive bg-destructive/10" : urgent ? "border-primary bg-primary/10" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <button type="button" className="min-w-0 text-left" onClick={() => onOpen(item)}>
            <p className="truncate text-sm font-medium text-foreground">{item.title || item.clientName}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {item.title ? item.clientName : item.description}
            </p>
          </button>
          <KanbanItemHandle className="text-muted-foreground" onClick={(event) => event.stopPropagation()}>
            <GripVertical className="size-4" />
          </KanbanItemHandle>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Badge variant={urgent ? "destructive" : "outline"}>{demandPriorityLabel(item.priority)}</Badge>
          <span className={`text-xs tabular-nums ${overdue ? "text-destructive" : "text-foreground"}`}>
            {formatDueOn(item.dueOn, "Sem prazo")}
          </span>
        </div>
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => onOpen(item)}>
          Ver detalhes
        </Button>
      </div>
    </KanbanItem>
  );
}

function DemandList({ records, onOpen }: { records: DemandRecord[]; onOpen: (item: DemandRecord) => void }) {
  return (
    <div className="surface overflow-hidden p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead>Descrição</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((item) => (
            <TableRow key={item.id} className="cursor-pointer" onClick={() => onOpen(item)}>
              <TableCell>
                <p className="font-medium">{item.clientName}</p>
                <p className="text-xs text-muted-foreground">{item.responsibleName || "—"}</p>
              </TableCell>
              <TableCell><Badge variant="secondary">{demandKindLabel(item.kind)}</Badge></TableCell>
              <TableCell><Badge variant="outline">{demandStatusLabel(item.status)}</Badge></TableCell>
              <TableCell><Badge variant="outline">{demandPriorityLabel(item.priority)}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{formatDueOn(item.dueOn)}</TableCell>
              <TableCell className="max-w-md whitespace-normal text-muted-foreground">{item.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
