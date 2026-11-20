"use client";

import { Plus, Trash } from "lucide-react";
import { type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue, useFieldArray, useWatch } from "react-hook-form";
import { nativeSelectClass } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { centsToReais, formatCents, reaisToCents } from "@/lib/finance/money";
import type { BillingType, Product } from "@/lib/finance/types";

export type LineItemInput = {
  id?: string;
  productId?: string;
  description: string;
  billingType: BillingType;
  quantity: number | string;
  unitPrice: number | string;
  installments: number | string;
  firstDueDate?: string;
};

// O editor serve a proposta e o contrato: os dois formulários têm `items: LineItemInput[]`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ItemsForm = { items: LineItemInput[] } & Record<string, any>;

export function emptyItem(product?: Product): LineItemInput {
  return {
    productId: product?.id ?? "",
    description: product?.name ?? "",
    billingType: product?.billingType ?? "recurring",
    quantity: 1,
    unitPrice: product ? centsToReais(product.defaultPriceCents) : "",
    installments: 1,
    firstDueDate: "",
  };
}

export function itemsSummary(items: LineItemInput[] | undefined) {
  let recurring = 0;
  let oneOff = 0;
  for (const item of items ?? []) {
    const total = (Number(item.quantity) || 0) * reaisToCents(Number(item.unitPrice) || 0);
    if (item.billingType === "recurring") recurring += total;
    else oneOff += total;
  }
  return { recurring, oneOff };
}

type Props = {
  control: Control<ItemsForm>;
  register: UseFormRegister<ItemsForm>;
  setValue: UseFormSetValue<ItemsForm>;
  errors?: FieldErrors<ItemsForm>["items"];
  products: Product[];
  showFirstDue?: boolean;
};

export function LineItemsEditor({ control, register, setValue, errors, products, showFirstDue }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = useWatch({ control, name: "items" }) as LineItemInput[] | undefined;
  const summary = itemsSummary(items);
  const active = products.filter((product) => product.active);
  const listError = errors && !Array.isArray(errors) ? (errors as { message?: string }).message ?? (errors as { root?: { message?: string } }).root?.message : undefined;

  function applyProduct(index: number, productId: string) {
    const product = products.find((item) => item.id === productId);
    setValue(`items.${index}.productId`, productId);
    if (!product) return;
    setValue(`items.${index}.description`, product.name);
    setValue(`items.${index}.billingType`, product.billingType);
    setValue(`items.${index}.unitPrice`, centsToReais(product.defaultPriceCents));
  }

  return (
    <div className="grid gap-3">
      {fields.map((field, index) => {
        const item = items?.[index];
        const itemErrors = Array.isArray(errors) ? errors[index] : undefined;
        const total = (Number(item?.quantity) || 0) * reaisToCents(Number(item?.unitPrice) || 0);
        const oneOff = item?.billingType === "one_off";
        return (
          <div key={field.id} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-12">
            <input type="hidden" {...register(`items.${index}.id`)} />
            <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-4">
              Produto
              <select className={nativeSelectClass} value={item?.productId ?? ""} onChange={(event) => applyProduct(index, event.target.value)}>
                <option value="">Item livre</option>
                {active.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-5">
              Descrição
              <Input {...register(`items.${index}.description`)} aria-invalid={Boolean(itemErrors?.description)} />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-3">
              Cobrança
              <select className={nativeSelectClass} {...register(`items.${index}.billingType`)}>
                <option value="recurring">Mensal</option>
                <option value="one_off">Avulso</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-2">
              Qtd.
              <Input type="number" min="1" step="1" {...register(`items.${index}.quantity`)} />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-3">
              Valor unit. (R$)
              <Input type="number" min="0" step="0.01" inputMode="decimal" {...register(`items.${index}.unitPrice`)} aria-invalid={Boolean(itemErrors?.unitPrice)} />
            </label>
            {oneOff ? (
              <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-2">
                Parcelas
                <Input type="number" min="1" max="60" step="1" {...register(`items.${index}.installments`)} />
              </label>
            ) : null}
            {oneOff && showFirstDue ? (
              <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-3">
                1º vencimento
                <Input type="date" {...register(`items.${index}.firstDueDate`)} />
              </label>
            ) : null}
            <div className="flex items-end justify-between gap-2 sm:col-span-12 sm:justify-end">
              <span className="text-sm tabular-nums">
                {formatCents(total)}
                <span className="text-muted-foreground">{oneOff ? (Number(item?.installments) > 1 ? ` em ${item?.installments}x` : " avulso") : " /mês"}</span>
              </span>
              <Button type="button" variant="ghost" size="icon" aria-label="Remover item" onClick={() => remove(index)} disabled={fields.length === 1}>
                <Trash />
              </Button>
            </div>
            {itemErrors?.description?.message || itemErrors?.unitPrice?.message ? (
              <p className="text-xs text-destructive sm:col-span-12">{itemErrors?.description?.message || itemErrors?.unitPrice?.message}</p>
            ) : null}
          </div>
        );
      })}
      {listError ? <p className="text-xs text-destructive">{listError}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => append(emptyItem())}>
          <Plus /> Adicionar item
        </Button>
        <p className="text-sm text-muted-foreground">
          Mensal <span className="tabular-nums text-foreground">{formatCents(summary.recurring)}</span> · Avulso{" "}
          <span className="tabular-nums text-foreground">{formatCents(summary.oneOff)}</span>
        </p>
      </div>
    </div>
  );
}
