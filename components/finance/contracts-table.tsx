"use client";

import Link from "next/link";
import { useState } from "react";
import { DataTable, type FinanceColumn } from "@/components/finance/data-table";
import { contractTone } from "@/components/finance/tones";
import { nativeSelectClass, StatusBadge } from "@/components/finance/ui";
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
        <select className={`${nativeSelectClass} w-auto`} value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="Filtrar status">
          <option value="all">Todos</option>
          {CONTRACT_STATUSES.map((value) => (
            <option key={value} value={value}>{contractStatusLabels[value]}</option>
          ))}
        </select>
      }
    />
  );
}
