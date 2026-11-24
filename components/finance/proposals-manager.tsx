"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Ellipsis, Loader2, Pencil, Plus, Send, Trash, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, type Control, type UseFormRegister, type UseFormSetValue, useForm } from "react-hook-form";
import type { z } from "zod";
import { financeRequest } from "@/components/finance/api";
import { DataTable, type FinanceColumn } from "@/components/finance/data-table";
import { emptyItem, type LineItemInput, LineItemsEditor } from "@/components/finance/line-items-editor";
import { proposalTone as tone } from "@/components/finance/tones";
import { Field, StatusBadge } from "@/components/finance/ui";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, todayIso } from "@/lib/finance/dates";
import { proposalStatusLabels } from "@/lib/finance/labels";
import { centsToReais, formatCents } from "@/lib/finance/money";
import { PROPOSAL_STATUSES, type Customer, type Lead, type Product, type ProfileRef, type Proposal, type ProposalStatus } from "@/lib/finance/types";
import { proposalSchema } from "@/lib/validations/finance";

type FormInput = z.input<typeof proposalSchema>;
type FormOutput = z.output<typeof proposalSchema>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ItemsForm = { items: LineItemInput[] } & Record<string, any>;

type Props = {
  proposals: Proposal[];
  customers: Customer[];
  leads: Lead[];
  products: Product[];
  people: ProfileRef[];
  currentUserId: string;
  defaultDueDay: number;
  canDelete: boolean;
  /** Lead vindo de ?lead= para abrir a proposta já preenchida. */
  initialLeadId?: string | null;
};

export function ProposalsManager({ proposals, customers, leads, products, people, currentUserId, defaultDueDay, canDelete, initialLeadId }: Props) {
  const router = useRouter();
  const initialLead = initialLeadId ? leads.find((lead) => lead.id === initialLeadId) ?? null : null;
  const [open, setOpen] = useState(Boolean(initialLead));
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [prefillLead, setPrefillLead] = useState<Lead | null>(initialLead);
  const [accepting, setAccepting] = useState<Proposal | null>(null);
  const [statusFilter, setStatusFilter] = useState<"open" | "all" | ProposalStatus>("open");

  const visible = proposals.filter((proposal) => (statusFilter === "all" ? true : statusFilter === "open" ? proposal.status === "draft" || proposal.status === "sent" : proposal.status === statusFilter));

  function edit(proposal: Proposal | null) {
    setEditing(proposal);
    setPrefillLead(null);
    setOpen(true);
  }

  async function setStatus(proposal: Proposal, status: ProposalStatus) {
    if (await financeRequest(`/api/finance/proposals/${proposal.id}`, "PATCH", { status }, "Proposta atualizada.")) router.refresh();
  }

  async function remove(proposal: Proposal) {
    if (!window.confirm(`Excluir a proposta “${proposal.title}”?`)) return;
    if (await financeRequest(`/api/finance/proposals/${proposal.id}`, "DELETE", undefined, "Proposta excluída.")) router.refresh();
  }

  const columns: FinanceColumn<Proposal>[] = [
    {
      accessorKey: "title",
      header: "Proposta",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          <p className="text-xs text-muted-foreground">{row.original.customerName ?? row.original.contactName ?? "—"}{row.original.customerName ? "" : " · lead"}</p>
        </div>
      ),
    },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge label={proposalStatusLabels[row.original.status]} tone={tone[row.original.status]} /> },
    { accessorKey: "recurringCents", header: "Mensal", className: "text-right tabular-nums", cell: ({ row }) => formatCents(row.original.recurringCents) },
    { accessorKey: "oneOffCents", header: "Avulso", className: "text-right tabular-nums", cell: ({ row }) => formatCents(row.original.oneOffCents) },
    { accessorKey: "ownerName", header: "Responsável", cell: ({ row }) => row.original.ownerName ?? "—" },
    { accessorKey: "validUntil", header: "Validade", className: "tabular-nums", cell: ({ row }) => formatDate(row.original.validUntil) },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      className: "text-right",
      enableSorting: false,
      cell: ({ row }) => {
        const proposal = row.original;
        const editable = proposal.status !== "accepted";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" aria-label={`Ações de ${proposal.title}`}><Ellipsis /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              {editable ? <DropdownMenuItem onClick={() => edit(proposal)}><Pencil /> Editar</DropdownMenuItem> : null}
              {proposal.status === "draft" ? <DropdownMenuItem onClick={() => setStatus(proposal, "sent")}><Send /> Marcar como enviada</DropdownMenuItem> : null}
              {proposal.status === "draft" || proposal.status === "sent" ? (
                <>
                  <DropdownMenuItem onClick={() => setAccepting(proposal)}><CheckCircle2 /> Aceitar e gerar contrato</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatus(proposal, "rejected")}><XCircle /> Recusada</DropdownMenuItem>
                </>
              ) : null}
              {proposal.status === "rejected" || proposal.status === "expired" ? <DropdownMenuItem onClick={() => setStatus(proposal, "draft")}>Voltar para rascunho</DropdownMenuItem> : null}
              {canDelete && editable ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => remove(proposal)}><Trash /> Excluir</DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        data={visible}
        columns={columns}
        searchText={(proposal) => [proposal.title, proposal.customerName, proposal.contactName, proposal.ownerName].filter(Boolean).join(" ")}
        searchPlaceholder="Buscar proposta ou cliente"
        empty="Nenhuma proposta neste filtro."
        initialSort={[{ id: "validUntil", desc: false }]}
        toolbar={
          <>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Em aberto</SelectItem>
                <SelectItem value="all">Todas</SelectItem>
                {PROPOSAL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{proposalStatusLabels[status]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="ml-auto" onClick={() => edit(null)}><Plus /> Nova proposta</Button>
          </>
        }
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="panel">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar proposta" : "Nova proposta"}</SheetTitle>
            <SheetDescription>Itens mensais viram a mensalidade do contrato; avulsos podem ser parcelados.</SheetDescription>
          </SheetHeader>
          <ProposalForm
            key={editing?.id ?? prefillLead?.id ?? "new"}
            proposal={editing}
            prefillLead={prefillLead}
            customers={customers}
            leads={leads}
            products={products}
            people={people}
            currentUserId={currentUserId}
            onCancel={() => setOpen(false)}
            onSaved={() => {
              setOpen(false);
              if (prefillLead) router.replace("/app/financeiro/comercial");
              router.refresh();
            }}
          />
        </SheetContent>
      </Sheet>

      <AcceptDialog proposal={accepting} people={people} defaultDueDay={defaultDueDay} onOpenChange={(value) => !value && setAccepting(null)} onAccepted={(contractId) => router.push(`/app/financeiro/contratos/${contractId}`)} />
    </>
  );
}

function ProposalForm({ proposal, prefillLead, customers, leads, products, people, currentUserId, onCancel, onSaved }: {
  proposal: Proposal | null;
  prefillLead: Lead | null;
  customers: Customer[];
  leads: Lead[];
  products: Product[];
  people: ProfileRef[];
  currentUserId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const openLeads = leads.filter((lead) => !lead.convertedCustomerId && lead.status !== "lost" && lead.status !== "archived");
  const initialTarget = proposal?.customerId ? `c:${proposal.customerId}` : proposal?.contactId ? `l:${proposal.contactId}` : prefillLead ? `l:${prefillLead.id}` : "";
  const [target, setTarget] = useState(initialTarget);
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: proposal?.title ?? (prefillLead ? `Proposta ${prefillLead.company || prefillLead.name}` : ""),
      customerId: proposal?.customerId ?? "",
      contactId: proposal?.contactId ?? prefillLead?.id ?? "",
      ownerId: proposal?.ownerId ?? prefillLead?.assigneeId ?? currentUserId,
      status: proposal?.status === "accepted" ? "draft" : (proposal?.status ?? "draft"),
      validUntil: proposal?.validUntil ?? "",
      notes: proposal?.notes ?? "",
      items: proposal?.items.length
        ? proposal.items.map((item) => ({ productId: item.productId ?? "", description: item.description, billingType: item.billingType, quantity: item.quantity, unitPrice: centsToReais(item.unitPriceCents), installments: item.installments }))
        : [emptyItem() as FormInput["items"][number]],
    },
  });
  const errors = form.formState.errors;

  function chooseTarget(value: string) {
    setTarget(value);
    form.setValue("customerId", value.startsWith("c:") ? value.slice(2) : "");
    form.setValue("contactId", value.startsWith("l:") ? value.slice(2) : "");
  }

  async function onSubmit(values: FormOutput) {
    setLoading(true);
    const saved = await financeRequest(proposal ? `/api/finance/proposals/${proposal.id}` : "/api/finance/proposals", proposal ? "PUT" : "POST", values, "Proposta salva.");
    setLoading(false);
    if (saved) onSaved();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <Field label="Título" error={errors.title?.message} className="sm:col-span-2">
        <Input {...form.register("title")} autoFocus />
      </Field>
      <Field label="Para" error={errors.customerId?.message}>
        <SearchableSelect
          value={target}
          onValueChange={chooseTarget}
          emptyLabel="Escolha cliente ou lead"
          placeholder="Escolha cliente ou lead"
          options={[
            ...customers.map((customer) => ({ value: `c:${customer.id}`, label: `Cliente · ${customer.name}` })),
            ...openLeads.map((lead) => ({ value: `l:${lead.id}`, label: `Lead · ${lead.company ? `${lead.company} (${lead.name})` : lead.name}` })),
          ]}
        />
      </Field>
      <Field label="Responsável" error={errors.ownerId?.message}>
        <Controller
          control={form.control}
          name="ownerId"
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
      <Field label="Status" error={errors.status?.message}>
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["draft", "sent", "rejected", "expired"] as const).map((status) => (
                  <SelectItem key={status} value={status}>{proposalStatusLabels[status]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field label="Válida até" error={errors.validUntil?.message}>
        <Input type="date" {...form.register("validUntil")} />
      </Field>
      <div className="grid gap-2 sm:col-span-2">
        <p className="text-sm font-medium">Itens</p>
        <LineItemsEditor
          control={form.control as unknown as Control<ItemsForm>}
          register={form.register as unknown as UseFormRegister<ItemsForm>}
          setValue={form.setValue as unknown as UseFormSetValue<ItemsForm>}
          errors={errors.items as never}
          products={products}
        />
      </div>
      <Field label="Observações" error={errors.notes?.message} className="sm:col-span-2">
        <Textarea rows={3} {...form.register("notes")} />
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : null}Salvar proposta</Button>
      </div>
    </form>
  );
}

function AcceptDialog({ proposal, people, defaultDueDay, onOpenChange, onAccepted }: { proposal: Proposal | null; people: ProfileRef[]; defaultDueDay: number; onOpenChange: (open: boolean) => void; onAccepted: (contractId: string) => void }) {
  return (
    <Sheet open={Boolean(proposal)} onOpenChange={onOpenChange}>
      <SheetContent size="panel">
        <SheetHeader>
          <SheetTitle>Aceitar proposta</SheetTitle>
          <SheetDescription>Gera o contrato com os itens da proposta{proposal?.customerId ? "" : " e converte o lead em cliente"}.</SheetDescription>
        </SheetHeader>
        {proposal ? <AcceptForm key={proposal.id} proposal={proposal} people={people} defaultDueDay={defaultDueDay} onCancel={() => onOpenChange(false)} onAccepted={onAccepted} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function AcceptForm({ proposal, people, defaultDueDay, onCancel, onAccepted }: { proposal: Proposal; people: ProfileRef[]; defaultDueDay: number; onCancel: () => void; onAccepted: (contractId: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(todayIso());
  const [dueDay, setDueDay] = useState(defaultDueDay);
  const [sellerId, setSellerId] = useState(proposal.ownerId ?? "");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const contractId = await financeRequest<string>(`/api/finance/proposals/${proposal.id}/accept`, "POST", { startDate, dueDay, sellerId }, "Contrato criado.");
    setLoading(false);
    if (contractId) onAccepted(contractId);
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="rounded-md border border-border p-3 text-sm">
        <p className="font-medium">{proposal.title}</p>
        <p className="mt-1 text-muted-foreground">
          {formatCents(proposal.recurringCents)} /mês{proposal.oneOffCents ? ` · ${formatCents(proposal.oneOffCents)} avulso` : ""}
        </p>
      </div>
      <Field label="Início do contrato">
        <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
      </Field>
      <Field label="Dia de vencimento" hint="Dias 29–31 caem no último dia em meses mais curtos.">
        <Input type="number" min={1} max={31} value={dueDay} onChange={(event) => setDueDay(Number(event.target.value))} required />
      </Field>
      <Field label="Vendedor (comissão)">
        <SearchableSelect
          value={sellerId}
          onValueChange={setSellerId}
          emptyLabel="Sem vendedor"
          placeholder="Sem vendedor"
          options={people.map((person) => ({ value: person.id, label: person.name }))}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : null}Gerar contrato</Button>
      </div>
    </form>
  );
}
