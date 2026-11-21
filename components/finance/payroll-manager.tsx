"use client";

import { CheckCircle2, Loader2, Lock, Pencil, RefreshCw, RotateCcw, Trash, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { financeRequest } from "@/components/finance/api";
import { DataTable, type FinanceColumn } from "@/components/finance/data-table";
import { payrollTone } from "@/components/finance/tones";
import { Field, StatusBadge } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, todayIso } from "@/lib/finance/dates";
import { contractTypeLabels, payrollStatusLabels } from "@/lib/finance/labels";
import { centsToReais, formatCents } from "@/lib/finance/money";
import type { PayrollItem, PayrollRun } from "@/lib/finance/types";

export function PayrollManager({ month, run, items }: { month: string; run: PayrollRun | null; items: PayrollItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<PayrollItem | null>(null);
  const draft = !run || run.status === "draft";

  async function call(key: string, url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown, success?: string) {
    setBusy(key);
    const done = await financeRequest(url, method, body, success);
    setBusy(null);
    if (done) router.refresh();
    return done;
  }

  const build = () => call("build", "/api/finance/payroll/build", "POST", { month: month.slice(0, 7) }, run ? "Folha recalculada." : "Folha gerada.");
  const setRun = (status: "draft" | "closed" | "paid", success: string) => run && call(status, `/api/finance/payroll/runs/${run.id}`, "PATCH", { status, paidAt: status === "paid" ? todayIso() : "" }, success);
  const removeRun = () => run && window.confirm("Excluir a folha em rascunho deste mês?") && call("delete", `/api/finance/payroll/runs/${run.id}`, "DELETE", undefined, "Folha excluída.");
  const togglePaid = (item: PayrollItem) => call(item.id, `/api/finance/payroll/items/${item.id}`, "PATCH", { paidAt: item.paidAt ? null : todayIso() }, item.paidAt ? "Pagamento desfeito." : "Pagamento registrado.");

  const columns: FinanceColumn<PayrollItem>[] = [
    {
      accessorKey: "employeeName",
      header: "Pessoa",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.employeeName}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.contractType ? contractTypeLabels[row.original.contractType] ?? row.original.contractType : "—"}
            {row.original.paymentDay ? ` · paga dia ${row.original.paymentDay}` : ""}
          </p>
        </div>
      ),
    },
    { accessorKey: "baseCents", header: "Fixo", className: "text-right tabular-nums", cell: ({ row }) => formatCents(row.original.baseCents) },
    { accessorKey: "commissionCents", header: "Comissão", className: "text-right tabular-nums", cell: ({ row }) => formatCents(row.original.commissionCents) },
    { accessorKey: "additionalCents", header: "Adicional", className: "text-right tabular-nums", cell: ({ row }) => formatCents(row.original.additionalCents) },
    { accessorKey: "bonusCents", header: "Bônus", className: "text-right tabular-nums", cell: ({ row }) => formatCents(row.original.bonusCents) },
    { accessorKey: "deductionCents", header: "Descontos", className: "text-right tabular-nums", cell: ({ row }) => (row.original.deductionCents ? `−${formatCents(row.original.deductionCents)}` : formatCents(0)) },
    { accessorKey: "totalCents", header: "Total", className: "text-right font-medium tabular-nums", cell: ({ row }) => formatCents(row.original.totalCents) },
    {
      accessorKey: "paidAt",
      header: "Pagamento",
      cell: ({ row }) => (row.original.paidAt ? <StatusBadge label={`Pago ${formatDate(row.original.paidAt)}`} tone="positive" /> : <StatusBadge label="Pendente" tone="info" />),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      className: "text-right",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          {run?.status !== "paid" ? (
            <Button size="icon" variant="ghost" aria-label={`Ajustar ${row.original.employeeName}`} onClick={() => setEditing(row.original)} disabled={!draft}>
              <Pencil />
            </Button>
          ) : null}
          {run && run.status !== "draft" ? (
            <Button size="sm" variant="outline" onClick={() => togglePaid(row.original)} disabled={busy === row.original.id}>
              {row.original.paidAt ? <RotateCcw /> : <CheckCircle2 />} {row.original.paidAt ? "Desfazer" : "Pagar"}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const total = items.reduce((sum, item) => sum + item.totalCents, 0);
  const paid = items.filter((item) => item.paidAt).reduce((sum, item) => sum + item.totalCents, 0);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {run ? <StatusBadge label={payrollStatusLabels[run.status]} tone={payrollTone[run.status]} /> : <StatusBadge label="Não gerada" />}
        <span className="text-sm text-muted-foreground">
          Total <span className="tabular-nums text-foreground">{formatCents(total)}</span> · pago <span className="tabular-nums text-foreground">{formatCents(paid)}</span>
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {draft ? (
            <Button variant="outline" onClick={build} disabled={busy === "build"}>
              {busy === "build" ? <Loader2 className="animate-spin" /> : <RefreshCw />} {run ? "Recalcular" : "Gerar folha"}
            </Button>
          ) : null}
          {run?.status === "draft" ? (
            <>
              <Button variant="ghost" onClick={removeRun} disabled={busy === "delete"}><Trash /> Excluir</Button>
              <Button onClick={() => setRun("closed", "Folha fechada.")} disabled={!items.length || busy === "closed"}><Lock /> Fechar folha</Button>
            </>
          ) : null}
          {run?.status === "closed" ? (
            <>
              <Button variant="ghost" onClick={() => setRun("draft", "Folha reaberta.")} disabled={busy === "draft"}><RotateCcw /> Reabrir</Button>
              <Button onClick={() => setRun("paid", "Folha marcada como paga.")} disabled={busy === "paid"}><Wallet /> Marcar tudo pago</Button>
            </>
          ) : null}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Gerada a partir da remuneração em Equipe (fixo, comissão e adicional). A comissão incide sobre o que foi recebido no mês nos contratos em que a pessoa é vendedora.
        Bônus e descontos ajustados à mão são mantidos ao recalcular.
      </p>
      <DataTable data={items} columns={columns} empty="Folha ainda não gerada para este mês." initialSort={[{ id: "employeeName", desc: false }]} pageSize={50} />
      <Sheet open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent size="panel">
          <SheetHeader>
            <SheetTitle>Ajustar lançamento</SheetTitle>
            <SheetDescription>{editing?.employeeName}</SheetDescription>
          </SheetHeader>
          {editing ? (
            <AdjustForm
              key={editing.id}
              item={editing}
              onDone={() => {
                setEditing(null);
                router.refresh();
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function AdjustForm({ item, onDone }: { item: PayrollItem; onDone: () => void }) {
  const [bonus, setBonus] = useState(String(centsToReais(item.bonusCents)));
  const [deduction, setDeduction] = useState(String(centsToReais(item.deductionCents)));
  const [notes, setNotes] = useState(item.notes ?? "");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const done = await financeRequest(`/api/finance/payroll/items/${item.id}`, "PATCH", { bonus, deduction, notes: notes.trim() || null }, "Lançamento ajustado.");
    setLoading(false);
    if (done) onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Bônus (R$)">
        <Input type="number" min="0" step="0.01" value={bonus} onChange={(event) => setBonus(event.target.value)} />
      </Field>
      <Field label="Descontos (R$)">
        <Input type="number" min="0" step="0.01" value={deduction} onChange={(event) => setDeduction(event.target.value)} />
      </Field>
      <Field label="Observações">
        <Textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Field>
      <Button disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : null}Salvar</Button>
    </form>
  );
}
