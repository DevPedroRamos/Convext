"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Control, type UseFormRegister, type UseFormSetValue, useForm } from "react-hook-form";
import type { z } from "zod";
import { financeRequest } from "@/components/finance/api";
import { emptyItem, type LineItemInput, LineItemsEditor } from "@/components/finance/line-items-editor";
import { Field, nativeSelectClass } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { todayIso } from "@/lib/finance/dates";
import { contractStatusLabels } from "@/lib/finance/labels";
import { centsToReais } from "@/lib/finance/money";
import { CONTRACT_STATUSES, type Contract, type Customer, type Product, type ProfileRef } from "@/lib/finance/types";
import { contractSchema } from "@/lib/validations/finance";

type FormInput = z.input<typeof contractSchema>;
type FormOutput = z.output<typeof contractSchema>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ItemsForm = { items: LineItemInput[] } & Record<string, any>;

type Props = { contract?: Contract | null; customers: Customer[]; products: Product[]; people: ProfileRef[]; defaultDueDay: number };

export function ContractDialog({ contract, customers, products, people, defaultDueDay }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      {contract ? (
        <Button variant="outline" onClick={() => setOpen(true)}><Pencil /> Editar</Button>
      ) : (
        <Button onClick={() => setOpen(true)}><Plus /> Novo contrato</Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto py-8 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{contract ? "Editar contrato" : "Novo contrato"}</DialogTitle>
            <DialogDescription>Alterações valem para as próximas parcelas; as já geradas não mudam.</DialogDescription>
          </DialogHeader>
          <ContractForm
            key={contract?.id ?? "new"}
            contract={contract ?? null}
            customers={customers}
            products={products}
            people={people}
            defaultDueDay={defaultDueDay}
            onCancel={() => setOpen(false)}
            onSaved={(id) => {
              setOpen(false);
              if (contract) router.refresh();
              else router.push(`/app/financeiro/contratos/${id}`);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function ContractForm({ contract, customers, products, people, defaultDueDay, onCancel, onSaved }: Omit<Props, "contract"> & { contract: Contract | null; onCancel: () => void; onSaved: (id: string) => void }) {
  const [loading, setLoading] = useState(false);
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      title: contract?.title ?? "",
      customerId: contract?.customerId ?? "",
      sellerId: contract?.sellerId ?? "",
      status: contract?.status ?? "active",
      startDate: contract?.startDate ?? todayIso(),
      endDate: contract?.endDate ?? "",
      dueDay: contract?.dueDay ?? defaultDueDay,
      notes: contract?.notes ?? "",
      items: contract?.items.length
        ? contract.items.map((item) => ({
            id: item.id,
            productId: item.productId ?? "",
            description: item.description,
            billingType: item.billingType,
            quantity: item.quantity,
            unitPrice: centsToReais(item.unitPriceCents),
            installments: item.installments,
            firstDueDate: item.firstDueDate ?? "",
          }))
        : [emptyItem() as FormInput["items"][number]],
    },
  });
  const errors = form.formState.errors;

  async function onSubmit(values: FormOutput) {
    setLoading(true);
    const id = await financeRequest<string>(contract ? `/api/finance/contracts/${contract.id}` : "/api/finance/contracts", contract ? "PUT" : "POST", values, "Contrato salvo.");
    setLoading(false);
    if (id) onSaved(id);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <Field label="Título" error={errors.title?.message} className="sm:col-span-2">
        <Input {...form.register("title")} autoFocus />
      </Field>
      <Field label="Cliente" error={errors.customerId?.message}>
        <select className={nativeSelectClass} {...form.register("customerId")}>
          <option value="">Escolha o cliente</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Vendedor (comissão)" error={errors.sellerId?.message}>
        <select className={nativeSelectClass} {...form.register("sellerId")}>
          <option value="">Sem vendedor</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Início" error={errors.startDate?.message}>
        <Input type="date" {...form.register("startDate")} />
      </Field>
      <Field label="Fim (opcional)" error={errors.endDate?.message}>
        <Input type="date" {...form.register("endDate")} />
      </Field>
      <Field label="Dia de vencimento" error={errors.dueDay?.message}>
        <Input type="number" min={1} max={31} {...form.register("dueDay")} />
      </Field>
      <Field label="Status" error={errors.status?.message}>
        <select className={nativeSelectClass} {...form.register("status")}>
          {CONTRACT_STATUSES.map((status) => (
            <option key={status} value={status}>{contractStatusLabels[status]}</option>
          ))}
        </select>
      </Field>
      <div className="grid gap-2 sm:col-span-2">
        <p className="text-sm font-medium">Itens</p>
        <LineItemsEditor
          control={form.control as unknown as Control<ItemsForm>}
          register={form.register as unknown as UseFormRegister<ItemsForm>}
          setValue={form.setValue as unknown as UseFormSetValue<ItemsForm>}
          errors={errors.items as never}
          products={products}
          showFirstDue
        />
      </div>
      <Field label="Observações" error={errors.notes?.message} className="sm:col-span-2">
        <Textarea rows={3} {...form.register("notes")} />
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : null}Salvar contrato</Button>
      </div>
    </form>
  );
}
