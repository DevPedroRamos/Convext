"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { financeRequest } from "@/components/finance/api";
import { Field, nativeSelectClass } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto py-8 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
          <DialogDescription>{lead?.source === "landing" ? "Lead recebido pelo site." : "Indicação, WhatsApp ou contato direto."}</DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
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
        <select className={nativeSelectClass} {...form.register("source")}>
          {LEAD_SOURCES.map((source) => (
            <option key={source} value={source}>{leadSourceLabels[source]}</option>
          ))}
        </select>
      </Field>
      <Field label="Etapa" error={errors.status?.message}>
        <select className={nativeSelectClass} {...form.register("status")}>
          {LEAD_STATUSES.map((value) => (
            <option key={value} value={value}>{leadStatusLabels[value]}</option>
          ))}
        </select>
      </Field>
      <Field label="Responsável" error={errors.assigneeId?.message}>
        <select className={nativeSelectClass} {...form.register("assigneeId")}>
          <option value="">Sem responsável</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </select>
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
    <Dialog open={Boolean(lead)} onOpenChange={onOpenChange}>
      <DialogContent className="py-8 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Converter em cliente</DialogTitle>
          <DialogDescription>Cria o cadastro financeiro e marca o lead como ganho.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Nome do cliente">
            <Input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
          </Field>
          <Field label="CPF / CNPJ">
            <Input value={document} onChange={(event) => setDocument(event.target.value)} />
          </Field>
          <Field label="Conta operacional (opcional)" hint="Vincula ao cliente atendido em Demandas.">
            <select className={nativeSelectClass} value={clientId} onChange={(event) => setClientId(event.target.value)}>
              <option value="">Sem vínculo</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : null}Converter</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
