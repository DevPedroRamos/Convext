"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Copy, Loader2, Pencil, Plus, RotateCcw, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { financeRequest } from "@/components/finance/api";
import { DataTable, type FinanceColumn } from "@/components/finance/data-table";
import { Field, StatusBadge } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, todayIso } from "@/lib/finance/dates";
import { centsToReais, formatCents } from "@/lib/finance/money";
import type { Expense, ExpenseCategory } from "@/lib/finance/types";
import { expenseSchema } from "@/lib/validations/finance";

type FormInput = z.input<typeof expenseSchema>;
type FormOutput = z.output<typeof expenseSchema>;

function toInput(expense: Expense): FormOutput {
  return {
    description: expense.description,
    categoryId: expense.categoryId ?? "",
    supplier: expense.supplier ?? "",
    amount: centsToReais(expense.amountCents),
    competence: expense.competence.slice(0, 7),
    dueDate: expense.dueDate ?? "",
    paidAt: expense.paidAt ?? "",
    recurring: expense.recurring,
    notes: expense.notes ?? "",
  };
}

export function ExpensesManager({ month, expenses, categories }: { month: string; expenses: Expense[]; categories: ExpenseCategory[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [copying, setCopying] = useState(false);

  function edit(expense: Expense | null) {
    setEditing(expense);
    setOpen(true);
  }

  async function togglePaid(expense: Expense) {
    const body = { ...toInput(expense), paidAt: expense.paidAt ? "" : todayIso() };
    if (await financeRequest(`/api/finance/expenses/${expense.id}`, "PUT", body, expense.paidAt ? "Pagamento desfeito." : "Despesa paga.")) router.refresh();
  }

  async function remove(expense: Expense) {
    if (!window.confirm(`Excluir “${expense.description}”?`)) return;
    if (await financeRequest(`/api/finance/expenses/${expense.id}`, "DELETE", undefined, "Despesa excluída.")) router.refresh();
  }

  async function copyRecurring() {
    setCopying(true);
    const result = await financeRequest<{ created: number }>("/api/finance/expenses/copy-recurring", "POST", { month: month.slice(0, 7) });
    setCopying(false);
    if (!result) return;
    toast.success(result.created ? `${result.created} despesa(s) recorrente(s) copiada(s).` : "Nada a copiar do mês anterior.");
    router.refresh();
  }

  const columns: FinanceColumn<Expense>[] = [
    {
      accessorKey: "description",
      header: "Despesa",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.description}</p>
          <p className="text-xs text-muted-foreground">{[row.original.categoryName, row.original.supplier, row.original.recurring ? "recorrente" : null].filter(Boolean).join(" · ") || "—"}</p>
        </div>
      ),
    },
    { accessorKey: "dueDate", header: "Vencimento", className: "tabular-nums", cell: ({ row }) => formatDate(row.original.dueDate) },
    { accessorKey: "amountCents", header: "Valor", className: "text-right tabular-nums", cell: ({ row }) => formatCents(row.original.amountCents) },
    {
      accessorKey: "paidAt",
      header: "Situação",
      cell: ({ row }) => (row.original.paidAt ? <StatusBadge label={`Paga ${formatDate(row.original.paidAt)}`} tone="positive" /> : <StatusBadge label="A pagar" tone={row.original.dueDate && row.original.dueDate < todayIso() ? "negative" : "info"} />),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      className: "text-right",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="outline" onClick={() => togglePaid(row.original)}>
            {row.original.paidAt ? <RotateCcw /> : <CheckCircle2 />} {row.original.paidAt ? "Desfazer" : "Pagar"}
          </Button>
          <Button size="icon" variant="ghost" aria-label={`Editar ${row.original.description}`} onClick={() => edit(row.original)}><Pencil /></Button>
          <Button size="icon" variant="ghost" aria-label={`Excluir ${row.original.description}`} onClick={() => remove(row.original)}><Trash /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={expenses}
        columns={columns}
        searchText={(expense) => [expense.description, expense.categoryName, expense.supplier].filter(Boolean).join(" ")}
        searchPlaceholder="Buscar despesa"
        empty="Nenhuma despesa lançada neste mês."
        initialSort={[{ id: "dueDate", desc: false }]}
        pageSize={25}
        toolbar={
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyRecurring} disabled={copying}>
              {copying ? <Loader2 className="animate-spin" /> : <Copy />} Copiar recorrentes do mês anterior
            </Button>
            <Button onClick={() => edit(null)}><Plus /> Nova despesa</Button>
          </div>
        }
      />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="panel">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar despesa" : "Nova despesa"}</SheetTitle>
            <SheetDescription>Entra no balanço pela data de pagamento.</SheetDescription>
          </SheetHeader>
          <ExpenseForm
            key={editing?.id ?? "new"}
            expense={editing}
            month={month}
            categories={categories}
            onCancel={() => setOpen(false)}
            onSaved={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

function ExpenseForm({ expense, month, categories, onCancel, onSaved }: { expense: Expense | null; month: string; categories: ExpenseCategory[]; onCancel: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense
      ? toInput(expense)
      : { description: "", categoryId: "", supplier: "", amount: undefined, competence: month.slice(0, 7), dueDate: "", paidAt: "", recurring: false, notes: "" },
  });
  const errors = form.formState.errors;
  const active = categories.filter((category) => category.active || category.id === expense?.categoryId);

  async function onSubmit(values: FormOutput) {
    setLoading(true);
    const saved = await financeRequest(expense ? `/api/finance/expenses/${expense.id}` : "/api/finance/expenses", expense ? "PUT" : "POST", values, "Despesa salva.");
    setLoading(false);
    if (saved) onSaved();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <Field label="Descrição" error={errors.description?.message} className="sm:col-span-2">
        <Input {...form.register("description")} autoFocus />
      </Field>
      <Field label="Categoria" error={errors.categoryId?.message}>
        <Controller
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {active.map((category) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field label="Fornecedor" error={errors.supplier?.message}>
        <Input {...form.register("supplier")} />
      </Field>
      <Field label="Valor (R$)" error={errors.amount?.message}>
        <Input type="number" min="0" step="0.01" inputMode="decimal" {...form.register("amount")} />
      </Field>
      <Field label="Competência" error={errors.competence?.message}>
        <Input type="month" {...form.register("competence")} />
      </Field>
      <Field label="Vencimento" error={errors.dueDate?.message}>
        <Input type="date" {...form.register("dueDate")} />
      </Field>
      <Field label="Pago em" error={errors.paidAt?.message}>
        <Input type="date" {...form.register("paidAt")} />
      </Field>
      <Controller
        control={form.control}
        name="recurring"
        render={({ field }) => (
          <label className="flex items-center gap-3 text-sm sm:col-span-2">
            <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} /> Recorrente (copiar para o mês seguinte)
          </label>
        )}
      />
      <Field label="Observações" error={errors.notes?.message} className="sm:col-span-2">
        <Textarea rows={2} {...form.register("notes")} />
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : null}Salvar</Button>
      </div>
    </form>
  );
}
