"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { billingTypeLabels } from "@/lib/finance/labels";
import { centsToReais, formatCents } from "@/lib/finance/money";
import type { Product } from "@/lib/finance/types";
import { productSchema } from "@/lib/validations/finance";

type FormInput = z.input<typeof productSchema>;
type FormOutput = z.output<typeof productSchema>;

export function ProductsManager({ products, canDelete }: { products: Product[]; canDelete: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  function edit(product: Product | null) {
    setEditing(product);
    setOpen(true);
  }

  async function remove(product: Product) {
    if (!window.confirm(`Excluir o produto ${product.name}? Propostas e contratos mantêm a descrição.`)) return;
    if (await financeRequest(`/api/finance/products/${product.id}`, "DELETE", undefined, "Produto excluído.")) router.refresh();
  }

  const columns: FinanceColumn<Product>[] = [
    {
      accessorKey: "name",
      header: "Produto",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          {row.original.description ? <p className="line-clamp-1 text-xs text-muted-foreground">{row.original.description}</p> : null}
        </div>
      ),
    },
    { accessorKey: "billingType", header: "Cobrança", cell: ({ row }) => billingTypeLabels[row.original.billingType] },
    { accessorKey: "defaultPriceCents", header: "Preço padrão", className: "text-right tabular-nums", cell: ({ row }) => formatCents(row.original.defaultPriceCents) },
    { accessorKey: "active", header: "Status", cell: ({ row }) => <StatusBadge label={row.original.active ? "Ativo" : "Inativo"} tone={row.original.active ? "positive" : "neutral"} /> },
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
        data={products}
        columns={columns}
        searchText={(product) => `${product.name} ${product.description ?? ""}`}
        searchPlaceholder="Buscar produto"
        empty="Nenhum produto cadastrado."
        initialSort={[{ id: "name", desc: false }]}
        toolbar={<Button className="ml-auto" onClick={() => edit(null)}><Plus /> Novo produto</Button>}
      />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="panel">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar produto" : "Novo produto"}</SheetTitle>
            <SheetDescription>Serviços vendidos nas propostas e contratos.</SheetDescription>
          </SheetHeader>
          <ProductForm
            key={editing?.id ?? "new"}
            product={editing}
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

function ProductForm({ product, onCancel, onSaved }: { product: Product | null; onCancel: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      billingType: product?.billingType ?? "recurring",
      defaultPrice: product ? centsToReais(product.defaultPriceCents) : undefined,
      active: product?.active ?? true,
    },
  });
  const errors = form.formState.errors;

  async function onSubmit(values: FormOutput) {
    setLoading(true);
    const saved = await financeRequest(product ? `/api/finance/products/${product.id}` : "/api/finance/products", product ? "PUT" : "POST", values, "Produto salvo.");
    setLoading(false);
    if (saved) onSaved();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nome" error={errors.name?.message} className="sm:col-span-2">
        <Input {...form.register("name")} autoFocus />
      </Field>
      <Field label="Cobrança" error={errors.billingType?.message}>
        <Controller
          control={form.control}
          name="billingType"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recurring">Mensal (recorrente)</SelectItem>
                <SelectItem value="one_off">Avulso (pontual)</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field label="Preço padrão (R$)" error={errors.defaultPrice?.message}>
        <Input type="number" step="0.01" min="0" inputMode="decimal" {...form.register("defaultPrice")} />
      </Field>
      <Field label="Descrição" error={errors.description?.message} className="sm:col-span-2">
        <Textarea rows={3} {...form.register("description")} />
      </Field>
      <Controller
        control={form.control}
        name="active"
        render={({ field }) => (
          <label className="flex items-center gap-3 text-sm sm:col-span-2">
            <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} /> Disponível para novas propostas
          </label>
        )}
      />
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : null}Salvar</Button>
      </div>
    </form>
  );
}
