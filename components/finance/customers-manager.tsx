"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { financeRequest } from "@/components/finance/api";
import { DataTable, type FinanceColumn } from "@/components/finance/data-table";
import { Field } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatCents } from "@/lib/finance/money";
import type { Customer, ProfileRef } from "@/lib/finance/types";
import { customerSchema } from "@/lib/validations/finance";

type FormInput = z.input<typeof customerSchema>;
type FormOutput = z.output<typeof customerSchema>;

export type CustomerRow = Customer & { activeContracts: number; mrrCents: number };

type Props = { customers: CustomerRow[]; people: ProfileRef[]; clients: { id: string; name: string }[]; canDelete: boolean };

export function CustomersManager({ customers, people, clients, canDelete }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  function edit(customer: Customer | null) {
    setEditing(customer);
    setOpen(true);
  }

  async function remove(customer: Customer) {
    if (!window.confirm(`Excluir ${customer.name}?`)) return;
    if (await financeRequest(`/api/finance/customers/${customer.id}`, "DELETE", undefined, "Cliente excluído.")) router.refresh();
  }

  const columns: FinanceColumn<CustomerRow>[] = [
    {
      accessorKey: "name",
      header: "Cliente",
      cell: ({ row }) => (
        <button type="button" className="text-left" onClick={() => edit(row.original)}>
          <span className="font-medium hover:text-primary">{row.original.name}</span>
          {row.original.legalName && row.original.legalName !== row.original.name ? <span className="block text-xs text-muted-foreground">{row.original.legalName}</span> : null}
        </button>
      ),
    },
    { accessorKey: "document", header: "CPF / CNPJ", className: "tabular-nums", cell: ({ row }) => row.original.document ?? <span className="text-muted-foreground">—</span> },
    { id: "contact", header: "Contato", enableSorting: false, cell: ({ row }) => <span className="text-sm">{[row.original.email, row.original.phone].filter(Boolean).join(" · ") || "—"}</span> },
    { accessorKey: "clientName", header: "Conta operacional", cell: ({ row }) => row.original.clientName ?? <span className="text-muted-foreground">—</span> },
    { accessorKey: "ownerName", header: "Responsável", cell: ({ row }) => row.original.ownerName ?? <span className="text-muted-foreground">—</span> },
    { accessorKey: "activeContracts", header: "Contratos", className: "text-right tabular-nums" },
    { accessorKey: "mrrCents", header: "Mensalidade", className: "text-right tabular-nums", cell: ({ row }) => formatCents(row.original.mrrCents) },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      className: "text-right",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" aria-label={`Editar ${row.original.name}`} onClick={() => edit(row.original)}><Pencil /></Button>
          {canDelete ? <Button size="icon" variant="ghost" aria-label={`Excluir ${row.original.name}`} onClick={() => remove(row.original)}><Trash /></Button> : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        data={customers}
        columns={columns}
        searchText={(customer) => [customer.name, customer.legalName, customer.document, customer.email, customer.phone, customer.clientName].filter(Boolean).join(" ")}
        searchPlaceholder="Buscar cliente, CNPJ ou e-mail"
        empty="Nenhum cliente financeiro. Converta um lead ou cadastre aqui."
        initialSort={[{ id: "name", desc: false }]}
        toolbar={<Button className="ml-auto" onClick={() => edit(null)}><Plus /> Novo cliente</Button>}
      />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="panel">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar cliente" : "Novo cliente financeiro"}</SheetTitle>
            <SheetDescription>Dados de cobrança usados em contratos e parcelas.</SheetDescription>
          </SheetHeader>
          <CustomerForm
            key={editing?.id ?? "new"}
            customer={editing}
            people={people}
            clients={clients}
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

function CustomerForm({ customer, people, clients, onCancel, onSaved }: { customer: Customer | null; people: ProfileRef[]; clients: { id: string; name: string }[]; onCancel: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name ?? "",
      legalName: customer?.legalName ?? "",
      document: customer?.document ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      address: customer?.address ?? "",
      notes: customer?.notes ?? "",
      clientId: customer?.clientId ?? "",
      ownerId: customer?.ownerId ?? "",
    },
  });
  const errors = form.formState.errors;

  async function onSubmit(values: FormOutput) {
    setLoading(true);
    const saved = await financeRequest(customer ? `/api/finance/customers/${customer.id}` : "/api/finance/customers", customer ? "PUT" : "POST", values, "Cliente salvo.");
    setLoading(false);
    if (saved) onSaved();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nome" error={errors.name?.message}>
        <Input {...form.register("name")} autoFocus />
      </Field>
      <Field label="Razão social" error={errors.legalName?.message}>
        <Input {...form.register("legalName")} />
      </Field>
      <Field label="CPF / CNPJ" error={errors.document?.message}>
        <Input {...form.register("document")} />
      </Field>
      <Field label="Telefone" error={errors.phone?.message}>
        <Input {...form.register("phone")} />
      </Field>
      <Field label="E-mail de cobrança" error={errors.email?.message} className="sm:col-span-2">
        <Input type="email" {...form.register("email")} />
      </Field>
      <Field label="Endereço" error={errors.address?.message} className="sm:col-span-2">
        <Input {...form.register("address")} />
      </Field>
      <Field label="Conta operacional" hint="Cliente atendido em Demandas." error={errors.clientId?.message}>
        <Controller
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem vínculo</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field label="Responsável" error={errors.ownerId?.message}>
        <Controller
          control={form.control}
          name="ownerId"
          render={({ field }) => (
            <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem responsável</SelectItem>
                {people.map((person) => (
                  <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field label="Observações" error={errors.notes?.message} className="sm:col-span-2">
        <Textarea rows={3} {...form.register("notes")} />
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : null}Salvar</Button>
      </div>
    </form>
  );
}
