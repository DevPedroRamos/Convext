"use client";

import Link from "next/link";
import { useState } from "react";
import { DataTable, type FinanceColumn } from "@/components/finance/data-table";
import { contractTone } from "@/components/finance/tones";
import { StatusBadge } from "@/components/finance/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/finance/dates";
import { contractStatusLabels } from "@/lib/finance/labels";
import { formatCents } from "@/lib/finance/money";
import { CONTRACT_STATUSES, type Contract, type ContractStatus } from "@/lib/finance/types";

export function ContractsTable({ contracts }: { contracts: Contract[] }) {
  const [status, setStatus] = useState<"all" | ContractStatus>("active");
  const data = status === "all" ? contracts : contracts.filter((contract) => contract.status === status);

  const columns: FinanceColumn<Contract>[] = [
    {
      accessorKey: "customerName",
      header: "Cliente",
      cell: ({ row }) => (
        <Link href={`/app/financeiro/contratos/${row.original.id}`} className="hover:text-primary">
          <span className="font-medium">{row.original.customerName}</span>
          <span className="block text-xs text-muted-foreground">{row.original.title}</span>
        </Link>
      ),
    },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge label={contractStatusLabels[row.original.status]} tone={contractTone[row.original.status]} /> },
    { accessorKey: "monthlyAmountCents", header: "Mensalidade", className: "text-right tabular-nums", cell: ({ row }) => formatCents(row.original.monthlyAmountCents) },
    { accessorKey: "dueDay", header: "Venc.", className: "tabular-nums", cell: ({ row }) => `dia ${row.original.dueDay}` },
    { accessorKey: "sellerName", header: "Vendedor", cell: ({ row }) => row.original.sellerName ?? "—" },
    { accessorKey: "startDate", header: "Início", className: "tabular-nums", cell: ({ row }) => formatDate(row.original.startDate) },
    { accessorKey: "endDate", header: "Fim", className: "tabular-nums", cell: ({ row }) => formatDate(row.original.endDate) },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchText={(contract) => `${contract.customerName} ${contract.title} ${contract.sellerName ?? ""}`}
      searchPlaceholder="Buscar contrato ou cliente"
      empty="Nenhum contrato neste filtro."
      initialSort={[{ id: "customerName", desc: false }]}
      toolbar={
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {CONTRACT_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>{contractStatusLabels[value]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    />
  );
}
