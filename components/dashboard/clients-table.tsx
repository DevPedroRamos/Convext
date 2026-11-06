"use client";

import {
  type ColumnDef,
  type FilterFn,
  type PaginationState,
  type SortingState,
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleX,
  Ellipsis,
  ListFilter,
  Pencil,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ClientRecord } from "@/lib/clients";
import { cn } from "@/lib/utils";

type ClientsTableProps = { clients: ClientRecord[]; canDelete?: boolean };

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
});

const searchFilter: FilterFn<typeof features, ClientRecord> = (row, _columnId, filterValue) => {
  const term = String(filterValue ?? "").trim().toLowerCase();
  if (!term) return true;
  const haystack = [row.original.name, row.original.company, row.original.responsibleName, row.original.whatsapp]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
};

export function isClientIncomplete(client: ClientRecord) {
  return !client.whatsapp?.trim() || !client.responsibleId;
}

export function ClientsTable({ clients, canDelete = false }: ClientsTableProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const data = useMemo(
    () => (incompleteOnly ? clients.filter(isClientIncomplete) : clients),
    [clients, incompleteOnly],
  );

  const columns = useMemo<ColumnDef<typeof features, ClientRecord>[]>(() => [
    {
      accessorKey: "name",
      header: "Cliente",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link href={`/app/clientes/${row.original.id}`} className="font-medium hover:text-primary">
            {row.original.name}
          </Link>
          {isClientIncomplete(row.original) ? <Badge variant="outline">Incompleto</Badge> : null}
        </div>
      ),
      size: 220,
    },
    {
      accessorKey: "responsibleName",
      header: "Responsável",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.responsibleName || "—"}</span>,
      size: 180,
    },
    {
      accessorKey: "company",
      header: "Empresa",
      size: 160,
    },
    {
      accessorKey: "whatsapp",
      header: "WhatsApp",
      cell: ({ row }) => <WhatsAppCell value={row.original.whatsapp} />,
      size: 220,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => <RowActions client={row.original} canDelete={canDelete} />,
      size: 64,
      enableSorting: false,
    },
  ], [canDelete]);

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: searchFilter,
    state: { sorting, pagination, globalFilter },
  });

  const { pagination: paginationState } = table.state;
  const rangeStart = table.getRowCount() === 0 ? 0 : paginationState.pageIndex * paginationState.pageSize + 1;
  const rangeEnd = Math.min(rangeStart + paginationState.pageSize - 1, table.getRowCount());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Input
            id={`${id}-search`}
            ref={inputRef}
            value={globalFilter}
            onChange={(event) => {
              setGlobalFilter(event.target.value);
              table.setPageIndex(0);
            }}
            placeholder="Buscar por cliente, empresa ou responsável"
            className={cn("min-w-60 ps-9", globalFilter && "pe-9")}
            aria-label="Buscar clientes"
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
            <ListFilter size={16} aria-hidden="true" />
          </div>
          {globalFilter ? (
            <button
              type="button"
              className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 hover:text-foreground"
              aria-label="Limpar busca"
              onClick={() => {
                setGlobalFilter("");
                inputRef.current?.focus();
              }}
            >
              <CircleX size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <Button
          type="button"
          variant={incompleteOnly ? "default" : "outline"}
          onClick={() => {
            setIncompleteOnly((current) => !current);
            table.setPageIndex(0);
          }}
        >
          Incompletos
          <span className="-me-1 ms-1 inline-flex h-5 items-center rounded border border-border bg-background px-1 text-[0.625rem] font-medium text-muted-foreground">
            {clients.filter(isClientIncomplete).length}
          </span>
        </Button>
      </div>

      <div className="surface overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: (header.column.columnDef as { size?: number }).size }} className="h-11">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="flex h-full w-full items-center justify-between gap-2"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" ? <ChevronUp className="size-4 opacity-60" /> : null}
                        {header.column.getIsSorted() === "desc" ? <ChevronDown className="size-4 opacity-60" /> : null}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(isClientIncomplete(row.original) && "border-l-2 border-l-primary bg-primary/5")}
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.id === "actions" ? "text-right" : undefined}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Label htmlFor={`${id}-page-size`} className="max-sm:sr-only">Linhas por página</Label>
          <Select
            value={String(paginationState.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger id={`${id}-page-size`} className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>{pageSize}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground">{rangeStart}-{rangeEnd}</span> de <span className="text-foreground">{table.getRowCount()}</span>
        </p>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()} aria-label="Primeira página">
            <ChevronFirst />
          </Button>
          <Button size="icon" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Página anterior">
            <ChevronLeft />
          </Button>
          <Button size="icon" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Próxima página">
            <ChevronRight />
          </Button>
          <Button size="icon" variant="outline" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()} aria-label="Última página">
            <ChevronLast />
          </Button>
        </div>
      </div>
    </div>
  );
}

function RowActions({ client, canDelete }: { client: ClientRecord; canDelete: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!window.confirm(`Excluir ${client.name}?`)) return;
    setLoading(true);
    const response = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      toast.error(payload.error || "Não foi possível excluir.");
      return;
    }
    toast.success("Cliente excluído.");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={`Ações de ${client.name}`}>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem asChild>
          <Link href={`/app/clientes/${client.id}`}><Pencil /> Editar</Link>
        </DropdownMenuItem>
        {canDelete ? (
          <DropdownMenuItem variant="destructive" disabled={loading} onClick={onDelete}>
            <Trash /> Excluir
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WhatsAppCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const parts = value.split("/").map((part) => part.trim()).filter(Boolean);
  return (
    <span className="flex flex-wrap gap-x-2 gap-y-1">
      {parts.map((part) => {
        const href = whatsappHref(part);
        if (!href) return <span key={part}>{part}</span>;
        return <a key={part} href={href} target="_blank" rel="noreferrer" className="hover:text-primary">{part}</a>;
      })}
    </span>
  );
}

function whatsappHref(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${phone}`;
}
