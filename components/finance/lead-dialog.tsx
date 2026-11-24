"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { financeRequest } from "@/components/finance/api";
import { Field } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { leadSourceLabels, leadStatusLabels } from "@/lib/finance/labels";
import { centsToReais } from "@/lib/finance/money";
import { LEAD_SOURCES, LEAD_STATUSES, type Lead, type ProfileRef } from "@/lib/finance/types";
import { leadSchema } from "@/lib/validations/finance";

type FormInput = z.input<typeof leadSchema>;
type FormOutput = z.output<typeof leadSchema>;

function defaults(lead?: Lead | null): FormInput {
  return {
    firstName: lead?.firstName ?? "",
    lastName: lead?.lastName ?? "",
    email: lead?.email ?? "",
    phone: lead?.phone ?? "",
    company: lead?.company ?? "",
    source: lead?.source ?? "manual",
    status: lead?.status ?? "new",
    assigneeId: lead?.assigneeId ?? "",
    estimatedValue: lead?.estimatedValueCents == null ? "" : centsToReais(lead.estimatedValueCents),
    notes: lead?.notes ?? "",
    lostReason: lead?.lostReason ?? "",
  };
}

export function LeadDialog({ open, onOpenChange, lead, people, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; lead?: Lead | null; people: ProfileRef[]; onSaved: () => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="panel">
        <SheetHeader>
          <SheetTitle>{lead ? "Editar lead" : "Novo lead"}</SheetTitle>
          <SheetDescription>{lead?.source === "landing" ? "Lead recebido pelo site." : "Indicação, WhatsApp ou contato direto."}</SheetDescription>
        </SheetHeader>
        <LeadForm
          key={lead?.id ?? "new"}
          lead={lead}
          people={people}
          onCancel={() => onOpenChange(false)}
          onSaved={() => {
            onOpenChange(false);
            onSaved();
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

function LeadForm({ lead, people, onCancel, onSaved }: { lead?: Lead | null; people: ProfileRef[]; onCancel: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const form = useForm<FormInput, unknown, FormOutput>({ resolver: zodResolver(leadSchema), defaultValues: defaults(lead) });
  const errors = form.formState.errors;
  const status = useWatch({ control: form.control, name: "status" });

  async function onSubmit(values: FormOutput) {
    setLoading(true);
    const saved = await financeRequest(lead ? `/api/finance/leads/${lead.id}` : "/api/finance/leads", lead ? "PUT" : "POST", values, lead ? "Lead atualizado." : "Lead cadastrado.");
    setLoading(false);
    if (saved) onSaved();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nome" error={errors.firstName?.message}>
        <Input {...form.register("firstName")} autoFocus />
      </Field>
      <Field label="Sobrenome" error={errors.lastName?.message}>
        <Input {...form.register("lastName")} />
      </Field>
      <Field label="Empresa" error={errors.company?.message}>
        <Input {...form.register("company")} />
      </Field>
      <Field label="Telefone / WhatsApp" error={errors.phone?.message}>
        <Input {...form.register("phone")} placeholder="11 99999-9999" />
      </Field>
      <Field label="E-mail" error={errors.email?.message} className="sm:col-span-2">
        <Input type="email" {...form.register("email")} />
      </Field>
      <Field label="Origem" error={errors.source?.message}>
        <Controller
          control={form.control}
          name="source"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((source) => (
                  <SelectItem key={source} value={source}>{leadSourceLabels[source]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field label="Etapa" error={errors.status?.message}>
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>{leadStatusLabels[value]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field label="Responsável" error={errors.assigneeId?.message}>
        <Controller
          control={form.control}
          name="assigneeId"
          render={({ field }) => (
            <SearchableSelect
              value={field.value || ""}
              onValueChange={field.onChange}
              emptyLabel="Sem responsável"
              placeholder="Sem responsável"
              options={people.map((person) => ({ value: person.id, label: person.name }))}
            />
          )}
        />
      </Field>
      <Field label="Valor estimado (R$/mês)" error={errors.estimatedValue?.message}>
        <Input type="number" step="0.01" min="0" inputMode="decimal" {...form.register("estimatedValue")} />
      </Field>
      {status === "lost" ? (
        <Field label="Motivo da perda" error={errors.lostReason?.message} className="sm:col-span-2">
          <Input {...form.register("lostReason")} />
        </Field>
      ) : null}
      <Field label="Observações" error={errors.notes?.message} className="sm:col-span-2">
        <Textarea rows={3} {...form.register("notes")} />
      </Field>
      {lead?.message ? (
        <div className="rounded-md border border-border p-3 text-sm text-muted-foreground sm:col-span-2">
          <p className="mb-1 text-xs uppercase tracking-wide">Mensagem do site{lead.inquiryType ? ` · ${lead.inquiryType}` : ""}</p>
          {lead.message}
        </div>
      ) : null}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : null}
          {lead ? "Salvar" : "Cadastrar lead"}
        </Button>
      </div>
    </form>
  );
}

export function ConvertLeadDialog({ lead, clients, onOpenChange, onConverted }: { lead: Lead | null; clients: { id: string; name: string }[]; onOpenChange: (open: boolean) => void; onConverted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [clientId, setClientId] = useState("");
  const [lastLead, setLastLead] = useState<string | null>(null);

  if (lead && lead.id !== lastLead) {
    setLastLead(lead.id);
    setName(lead.company || lead.name);
    setDocument("");
    setClientId("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!lead) return;
    setLoading(true);
    const done = await financeRequest(`/api/finance/leads/${lead.id}/convert`, "POST", { name, document, clientId }, "Lead convertido em cliente.");
    setLoading(false);
    if (!done) return;
    onOpenChange(false);
    onConverted();
  }

  return (
    <Sheet open={Boolean(lead)} onOpenChange={onOpenChange}>
      <SheetContent size="panel">
        <SheetHeader>
          <SheetTitle>Converter em cliente</SheetTitle>
          <SheetDescription>Cria o cadastro financeiro e marca o lead como ganho.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Nome do cliente">
            <Input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
          </Field>
          <Field label="CPF / CNPJ">
            <Input value={document} onChange={(event) => setDocument(event.target.value)} />
          </Field>
          <Field label="Conta operacional (opcional)" hint="Vincula ao cliente atendido em Demandas.">
            <SearchableSelect
              value={clientId}
              onValueChange={setClientId}
              emptyLabel="Sem vínculo"
              placeholder="Sem vínculo"
              options={clients.map((client) => ({ value: client.id, label: client.name }))}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : null}Converter</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
