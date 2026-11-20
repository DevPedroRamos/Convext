"use client";

import {
  type ColumnDef,
  type FilterFn,
  type RowData,
  columnFilteringFeature,
  type PaginationState,
  type SortingState,
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
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ListFilter } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const financeTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
});

export type FinanceColumn<T extends RowData> = ColumnDef<typeof financeTableFeatures, T> & { className?: string };

type DataTableProps<T extends RowData> = {
  data: T[];
  columns: FinanceColumn<T>[];
  /** Texto pesquisável de cada linha; sem ele a busca é ocultada. */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  empty?: string;
  toolbar?: ReactNode;
  pageSize?: number;
  initialSort?: SortingState;
  rowClassName?: (row: T) => string | undefined;
};

export function DataTable<T extends RowData>({ data, columns, searchText, searchPlaceholder = "Buscar", empty = "Nada por aqui.", toolbar, pageSize = 15, initialSort = [], rowClassName }: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>(initialSort);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });

  const filterFn: FilterFn<typeof financeTableFeatures, T> = (row, _columnId, value) => {
    const term = String(value ?? "").trim().toLowerCase();
    if (!term || !searchText) return true;
    return searchText(row.original).toLowerCase().includes(term);
  };

  const table = useTable({
    features: financeTableFeatures,
    data,
    columns,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: filterFn,
    state: { sorting, pagination, globalFilter },
  });

  const total = table.getRowCount();
  const { pageIndex, pageSize: size } = table.state.pagination;
  const start = total === 0 ? 0 : pageIndex * size + 1;
  const end = Math.min(start + size - 1, total);

  return (
    <div className="grid gap-3">
      {searchText || toolbar ? (
        <div className="flex flex-wrap items-center gap-2">
          {searchText ? (
            <div className="relative">
              <Input
                value={globalFilter}
                onChange={(event) => {
                  setGlobalFilter(event.target.value);
                  table.setPageIndex(0);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="min-w-60 ps-9"
              />
              <ListFilter className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground/80" aria-hidden="true" />
            </div>
          ) : null}
          {toolbar}
        </div>
      ) : null}
      <div className="surface overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => (
                  <TableHead key={header.id} className={cn("h-11 whitespace-nowrap", (header.column.columnDef as FinanceColumn<T>).className)}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button type="button" className="flex items-center gap-1" onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" ? <ChevronUp className="size-3.5 opacity-60" /> : null}
                        {header.column.getIsSorted() === "desc" ? <ChevronDown className="size-3.5 opacity-60" /> : null}
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
                <TableRow key={row.id} className={rowClassName?.(row.original)}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className={(cell.column.columnDef as FinanceColumn<T>).className}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {total > size ? (
        <div className="flex items-center justify-end gap-3 text-sm text-muted-foreground">
          <span>
            <span className="text-foreground">{start}–{end}</span> de <span className="text-foreground">{total}</span>
          </span>
          <Button size="icon" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Página anterior">
            <ChevronLeft />
          </Button>
          <Button size="icon" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Próxima página">
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
