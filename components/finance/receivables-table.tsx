"use client";

import { Ban, CheckCircle2, Ellipsis, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { financeRequest } from "@/components/finance/api";
import { DataTable, type FinanceColumn } from "@/components/finance/data-table";
import { Field, StatusBadge, type Tone } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formatDate, formatMonthShort, todayIso } from "@/lib/finance/dates";
import { receivableStatusLabels } from "@/lib/finance/labels";
import { centsToReais, formatCents } from "@/lib/finance/money";
import { receivableDisplayStatus } from "@/lib/finance/receivables";
import type { Receivable } from "@/lib/finance/types";

const tone: Record<string, Tone> = { open: "info", overdue: "negative", paid: "positive", cancelled: "neutral" };

export function GenerateReceivablesButton({ month, contractId, label = "Gerar parcelas do mês" }: { month: string; contractId?: string; label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const result = await financeRequest<{ created: number }>("/api/finance/receivables/generate", "POST", { month: month.slice(0, 7), contractId });
    setLoading(false);
    if (!result) return;
    toast.success(result.created ? `${result.created} parcela(s) gerada(s).` : "Nenhuma parcela nova: o mês já estava gerado.");
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" onClick={run} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />} {label}
    </Button>
  );
}

export function ReceivablesTable({ receivables, showContract = true, empty = "Nenhuma parcela neste mês." }: { receivables: Receivable[]; showContract?: boolean; empty?: string }) {
  const router = useRouter();
  const today = todayIso();
  const [paying, setPaying] = useState<Receivable | null>(null);

  async function act(receivable: Receivable, action: "reopen" | "cancel") {
    if (action === "cancel" && !window.confirm("Cancelar esta parcela? Ela deixa de ser cobrada.")) return;
    if (await financeRequest(`/api/finance/receivables/${receivable.id}`, "PATCH", { action }, action === "reopen" ? "Parcela reaberta." : "Parcela cancelada.")) router.refresh();
  }

  const columns: FinanceColumn<Receivable>[] = [
    ...(showContract
      ? ([
          {
            accessorKey: "customerName",
            header: "Cliente",
            cell: ({ row }) => (
              <Link href={`/app/financeiro/contratos/${row.original.contractId}`} className="hover:text-primary">
                <span className="font-medium">{row.original.customerName ?? "—"}</span>
                <span className="block text-xs text-muted-foreground">{row.original.contractTitle}</span>
              </Link>
            ),
          },
        ] satisfies FinanceColumn<Receivable>[])
      : []),
    {
      accessorKey: "kind",
      header: "Tipo",
      cell: ({ row }) =>
        row.original.kind === "recurring" ? `Mensalidade ${formatMonthShort(row.original.competence)}` : `Avulso ${row.original.installmentNumber}/${row.original.installmentsTotal}`,
    },
    { accessorKey: "dueDate", header: "Vencimento", className: "tabular-nums", cell: ({ row }) => formatDate(row.original.dueDate) },
    { accessorKey: "amountCents", header: "Valor", className: "text-right tabular-nums", cell: ({ row }) => formatCents(row.original.amountCents) },
    {
      accessorKey: "status",
      header: "Situação",
      cell: ({ row }) => {
        const status = receivableDisplayStatus(row.original, today);
        return (
          <div>
            <StatusBadge label={receivableStatusLabels[status]} tone={tone[status]} />
            {row.original.paidAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(row.original.paidAt)}
                {row.original.paidAmountCents != null && row.original.paidAmountCents !== row.original.amountCents ? ` · ${formatCents(row.original.paidAmountCents)}` : ""}
              </p>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      className: "text-right",
      enableSorting: false,
      cell: ({ row }) => {
        const receivable = row.original;
        return (
          <div className="flex justify-end gap-1">
            {receivable.status === "open" ? (
              <Button size="sm" variant="outline" onClick={() => setPaying(receivable)}>
                <CheckCircle2 /> Baixar
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Mais ações"><Ellipsis /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {receivable.status !== "open" ? <DropdownMenuItem onClick={() => act(receivable, "reopen")}><RotateCcw /> Reabrir</DropdownMenuItem> : null}
                {receivable.status !== "cancelled" ? <DropdownMenuItem variant="destructive" onClick={() => act(receivable, "cancel")}><Ban /> Cancelar parcela</DropdownMenuItem> : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        data={receivables}
        columns={columns}
        empty={empty}
        initialSort={[{ id: "dueDate", desc: false }]}
        searchText={showContract ? (receivable) => `${receivable.customerName ?? ""} ${receivable.contractTitle ?? ""}` : undefined}
        searchPlaceholder="Buscar cliente"
        rowClassName={(receivable) => (receivableDisplayStatus(receivable, today) === "overdue" ? "bg-destructive/5" : undefined)}
      />
      <Sheet open={Boolean(paying)} onOpenChange={(open) => !open && setPaying(null)}>
        <SheetContent size="panel">
          <SheetHeader>
            <SheetTitle>Dar baixa</SheetTitle>
            <SheetDescription>{paying ? `${paying.customerName ?? paying.contractTitle ?? ""} · vence ${formatDate(paying.dueDate)}` : ""}</SheetDescription>
          </SheetHeader>
          {paying ? (
            <PayForm
              key={paying.id}
              receivable={paying}
              onDone={() => {
                setPaying(null);
                router.refresh();
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function PayForm({ receivable, onDone }: { receivable: Receivable; onDone: () => void }) {
  const [paidAt, setPaidAt] = useState(todayIso());
  const [amount, setAmount] = useState(String(centsToReais(receivable.amountCents)));
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const done = await financeRequest(`/api/finance/receivables/${receivable.id}`, "PATCH", { action: "pay", paidAt, paidAmount: amount }, "Pagamento registrado.");
    setLoading(false);
    if (done) onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Data do pagamento">
        <Input type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} required />
      </Field>
      <Field label="Valor recebido (R$)" hint={`Valor da parcela: ${formatCents(receivable.amountCents)}`}>
        <Input type="number" step="0.01" min="0" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required />
      </Field>
      <Button disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : null}Confirmar recebimento</Button>
    </form>
  );
}
