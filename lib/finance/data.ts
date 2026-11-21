// Acesso a dados do financeiro (server-only). As tabelas finance_* ainda não estão em
// types/database.types.ts (entram ao regenerar os tipos após a migration), então o client
// é usado sem o genérico Database, como em lib/memory/store-supabase.ts. A RLS garante o acesso.
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { addMonths, monthEnd, monthStart, type IsoDate } from "@/lib/finance/dates";
import { reaisToCents } from "@/lib/finance/money";
import { buildPayroll, type CompensationRecord } from "@/lib/finance/payroll";
import { receivablesForMonth, type BillableContract } from "@/lib/finance/receivables";
import type {
  BillingType,
  Contract,
  ContractItem,
  ContractStatus,
  Customer,
  Expense,
  ExpenseCategory,
  FinanceSettings,
  Lead,
  LeadSource,
  LeadStatus,
  PayrollItem,
  PayrollRun,
  PayrollStatus,
  Product,
  ProfileRef,
  Proposal,
  ProposalStatus,
  Receivable,
  ReceivableStatus,
} from "@/lib/finance/types";
import type {
  ContractValues,
  CustomerValues,
  ExpenseValues,
  LeadValues,
  LineItemValues,
  ProductValues,
  ProposalValues,
} from "@/lib/validations/finance";

type Row = Record<string, unknown>;
type ProfileJoin = { id: string; first_name: string | null; last_name: string | null; email?: string | null } | null;

export async function financeDb(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

export type Result<T> = { data: T; error: null } | { data: null; error: string };

function ok<T>(data: T): Result<T> {
  return { data, error: null };
}

function fail<T>(error: { message?: string; code?: string } | string | null | undefined, fallback: string): Result<T> {
  if (!error) return { data: null, error: fallback };
  if (typeof error === "string") return { data: null, error };
  if (error.code === "23503") return { data: null, error: "Registro em uso por outro cadastro." };
  if (error.code === "23505") return { data: null, error: "Já existe um registro com esses dados." };
  if (error.code === "42501") return { data: null, error: "Sem permissão para esta ação." };
  return { data: null, error: error.message || fallback };
}

const blank = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);
const num = (value: unknown) => (value == null ? 0 : Number(value));
const one = <T,>(value: T | T[] | null | undefined): T | null => (Array.isArray(value) ? (value[0] ?? null) : (value ?? null));

export function personName(profile: ProfileJoin) {
  if (!profile) return null;
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return name || profile.email?.split("@")[0] || null;
}

const profileCols = "id, first_name, last_name, email";

// ---------------------------------------------------------------------------
// Pessoas (vendedores / responsáveis)
// ---------------------------------------------------------------------------

export async function listFinancePeople(): Promise<ProfileRef[]> {
  const db = await financeDb();
  const { data } = await db.from("profiles").select(`${profileCols}, role`).in("role", ["admin", "commercial"]).order("first_name");
  return ((data ?? []) as ProfileJoin[]).map((row) => ({ id: row!.id, name: personName(row) ?? "Sem nome" }));
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

function mapLead(row: Row): Lead {
  const assignee = one(row.assignee as ProfileJoin | ProfileJoin[]);
  const firstName = (row.first_name as string | null) ?? null;
  const lastName = (row.last_name as string | null) ?? null;
  return {
    id: row.id as string,
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(" ").trim() || (row.company as string | null) || (row.email as string | null) || "Sem nome",
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    company: (row.company as string | null) ?? null,
    message: (row.message as string | null) ?? null,
    inquiryType: (row.inquiry_type as string | null) ?? null,
    status: row.status as LeadStatus,
    source: (row.source as LeadSource) ?? "landing",
    assigneeId: (row.assignee_id as string | null) ?? null,
    assigneeName: personName(assignee),
    estimatedValueCents: row.estimated_value_cents == null ? null : num(row.estimated_value_cents),
    lostReason: (row.lost_reason as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    convertedCustomerId: (row.converted_customer_id as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? (row.created_at as string),
  };
}

const leadSelect = `*, assignee:profiles!contacts_assignee_id_fkey(${profileCols})`;

export async function listLeads(): Promise<Lead[]> {
  const db = await financeDb();
  const { data, error } = await db.from("contacts").select(leadSelect).order("created_at", { ascending: false }).limit(1000);
  if (error || !data) return [];
  return data.map(mapLead);
}

function leadRow(values: LeadValues) {
  return {
    first_name: values.firstName.trim(),
    last_name: blank(values.lastName),
    email: blank(values.email),
    phone: blank(values.phone),
    company: blank(values.company),
    source: values.source,
    status: values.status,
    assignee_id: blank(values.assigneeId),
    estimated_value_cents: values.estimatedValue == null ? null : reaisToCents(values.estimatedValue),
    notes: blank(values.notes),
    lost_reason: values.status === "lost" ? blank(values.lostReason) : null,
  };
}

export async function createLead(values: LeadValues): Promise<Result<Lead>> {
  const db = await financeDb();
  const { data, error } = await db.from("contacts").insert(leadRow(values)).select(leadSelect).single();
  return error || !data ? fail(error, "Não foi possível cadastrar o lead.") : ok(mapLead(data));
}

export async function updateLead(id: string, values: LeadValues): Promise<Result<Lead>> {
  const db = await financeDb();
  const { data, error } = await db.from("contacts").update(leadRow(values)).eq("id", id).select(leadSelect).single();
  return error || !data ? fail(error, "Não foi possível salvar o lead.") : ok(mapLead(data));
}

export async function patchLead(id: string, patch: { status?: LeadStatus; assigneeId?: string | null; lostReason?: string | null }): Promise<Result<Lead>> {
  const db = await financeDb();
  const row: Row = {};
  if (patch.status) row.status = patch.status;
  if (patch.assigneeId !== undefined) row.assignee_id = patch.assigneeId;
  if (patch.lostReason !== undefined) row.lost_reason = patch.lostReason;
  const { data, error } = await db.from("contacts").update(row).eq("id", id).select(leadSelect).single();
  return error || !data ? fail(error, "Não foi possível atualizar o lead.") : ok(mapLead(data));
}

export async function deleteLead(id: string): Promise<Result<true>> {
  const db = await financeDb();
  const { error } = await db.from("contacts").delete().eq("id", id);
  return error ? fail(error, "Não foi possível excluir o lead.") : ok(true);
}

export async function convertLead(id: string, values: { name?: string; document?: string; clientId?: string }): Promise<Result<string>> {
  const db = await financeDb();
  const { data, error } = await db.rpc("finance_convert_lead", {
    p_contact_id: id,
    p_name: blank(values.name),
    p_document: blank(values.document),
    p_client_id: blank(values.clientId),
  });
  return error || !data ? fail(error, "Não foi possível converter o lead.") : ok(data as string);
}

// ---------------------------------------------------------------------------
// Produtos
// ---------------------------------------------------------------------------

function mapProduct(row: Row): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    billingType: row.billing_type as BillingType,
    defaultPriceCents: num(row.default_price_cents),
    active: Boolean(row.active),
  };
}

export async function listProducts(): Promise<Product[]> {
  const db = await financeDb();
  const { data } = await db.from("finance_products").select("*").order("name");
  return (data ?? []).map(mapProduct);
}

function productRow(values: ProductValues) {
  return {
    name: values.name.trim(),
    description: blank(values.description),
    billing_type: values.billingType,
    default_price_cents: reaisToCents(values.defaultPrice),
    active: values.active,
  };
}

export async function saveProduct(id: string | null, values: ProductValues): Promise<Result<Product>> {
  const db = await financeDb();
  const query = id ? db.from("finance_products").update(productRow(values)).eq("id", id) : db.from("finance_products").insert(productRow(values));
  const { data, error } = await query.select("*").single();
  return error || !data ? fail(error, "Não foi possível salvar o produto.") : ok(mapProduct(data));
}

export async function deleteProduct(id: string): Promise<Result<true>> {
  const db = await financeDb();
  const { error } = await db.from("finance_products").delete().eq("id", id);
  return error ? fail(error, "Não foi possível excluir o produto.") : ok(true);
}

// ---------------------------------------------------------------------------
// Clientes financeiros
// ---------------------------------------------------------------------------

const customerSelect = `*, client:clients(id, name), owner:profiles!finance_customers_owner_id_fkey(${profileCols})`;

function mapCustomer(row: Row): Customer {
  const client = one(row.client as { id: string; name: string } | null);
  return {
    id: row.id as string,
    name: row.name as string,
    legalName: (row.legal_name as string | null) ?? null,
    document: (row.document as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    clientId: (row.client_id as string | null) ?? null,
    clientName: client?.name ?? null,
    contactId: (row.contact_id as string | null) ?? null,
    ownerId: (row.owner_id as string | null) ?? null,
    ownerName: personName(one(row.owner as ProfileJoin)),
    createdAt: row.created_at as string,
  };
}

export async function listCustomers(): Promise<Customer[]> {
  const db = await financeDb();
  const { data } = await db.from("finance_customers").select(customerSelect).order("name");
  return (data ?? []).map(mapCustomer);
}

function customerRow(values: CustomerValues) {
  return {
    name: values.name.trim(),
    legal_name: blank(values.legalName),
    document: blank(values.document),
    email: blank(values.email),
    phone: blank(values.phone),
    address: blank(values.address),
    notes: blank(values.notes),
    client_id: blank(values.clientId),
    owner_id: blank(values.ownerId),
  };
}

export async function saveCustomer(id: string | null, values: CustomerValues): Promise<Result<Customer>> {
  const db = await financeDb();
  const query = id ? db.from("finance_customers").update(customerRow(values)).eq("id", id) : db.from("finance_customers").insert(customerRow(values));
  const { data, error } = await query.select(customerSelect).single();
  return error || !data ? fail(error, "Não foi possível salvar o cliente.") : ok(mapCustomer(data));
}

export async function deleteCustomer(id: string): Promise<Result<true>> {
  const db = await financeDb();
  const { error } = await db.from("finance_customers").delete().eq("id", id);
  return error ? fail(error, "Não foi possível excluir o cliente.") : ok(true);
}

/** Clientes operacionais (tabela clients) para vincular ao cliente financeiro. */
export async function listClientOptions(): Promise<{ id: string; name: string }[]> {
  const db = await financeDb();
  const { data } = await db.from("clients").select("id, name").order("name");
  return (data ?? []) as { id: string; name: string }[];
}

// ---------------------------------------------------------------------------
// Itens (proposta e contrato)
// ---------------------------------------------------------------------------

function mapItem(row: Row) {
  return {
    id: row.id as string,
    productId: (row.product_id as string | null) ?? null,
    description: row.description as string,
    billingType: row.billing_type as BillingType,
    quantity: num(row.quantity),
    unitPriceCents: num(row.unit_price_cents),
    installments: num(row.installments) || 1,
  };
}

function itemRows(items: LineItemValues[]) {
  return items.map((item, position) => ({
    product_id: blank(item.productId),
    description: item.description.trim(),
    billing_type: item.billingType,
    quantity: item.quantity,
    unit_price_cents: reaisToCents(item.unitPrice),
    installments: item.billingType === "one_off" ? item.installments : 1,
    position,
  }));
}

function sortByPosition(rows: Row[] | null | undefined) {
  return [...(rows ?? [])].sort((a, b) => num(a.position) - num(b.position));
}

function totals(items: { billingType: BillingType; quantity: number; unitPriceCents: number }[]) {
  let recurring = 0;
  let oneOff = 0;
  for (const item of items) {
    const total = item.quantity * item.unitPriceCents;
    if (item.billingType === "recurring") recurring += total;
    else oneOff += total;
  }
  return { recurringCents: recurring, oneOffCents: oneOff };
}

// ---------------------------------------------------------------------------
// Propostas
// ---------------------------------------------------------------------------

const proposalSelect = `*, items:finance_proposal_items(*), customer:finance_customers(id, name),
  contact:contacts(id, first_name, last_name, company, email), owner:profiles!finance_proposals_owner_id_fkey(${profileCols})`;

function mapProposal(row: Row): Proposal {
  const items = sortByPosition(row.items as Row[]).map(mapItem);
  const contact = one<Row>(row.contact as Row | null);
  const contactName = contact
    ? [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim() || (contact.company as string | null) || (contact.email as string | null)
    : null;
  return {
    id: row.id as string,
    title: row.title as string,
    customerId: (row.customer_id as string | null) ?? null,
    customerName: one(row.customer as { name: string } | null)?.name ?? null,
    contactId: (row.contact_id as string | null) ?? null,
    contactName: contactName || null,
    ownerId: (row.owner_id as string | null) ?? null,
    ownerName: personName(one(row.owner as ProfileJoin)),
    status: row.status as ProposalStatus,
    validUntil: (row.valid_until as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    acceptedAt: (row.accepted_at as string | null) ?? null,
    createdAt: row.created_at as string,
    items,
    ...totals(items),
  };
}

export async function listProposals(): Promise<Proposal[]> {
  const db = await financeDb();
  const { data } = await db.from("finance_proposals").select(proposalSelect).order("created_at", { ascending: false });
  return (data ?? []).map(mapProposal);
}

export async function saveProposal(id: string | null, values: ProposalValues): Promise<Result<Proposal>> {
  const db = await financeDb();
  const row = {
    title: values.title.trim(),
    customer_id: blank(values.customerId),
    contact_id: blank(values.contactId),
    owner_id: blank(values.ownerId),
    status: values.status,
    valid_until: blank(values.validUntil),
    notes: blank(values.notes),
  };

  if (id) {
    const current = await db.from("finance_proposals").select("status").eq("id", id).single();
    if (current.error) return fail(current.error, "Proposta não encontrada.");
    if (current.data.status === "accepted") return fail(null, "Proposta aceita não pode ser alterada.");
  }

  const saved = id
    ? await db.from("finance_proposals").update(row).eq("id", id).select("id").single()
    : await db.from("finance_proposals").insert(row).select("id").single();
  if (saved.error || !saved.data) return fail(saved.error, "Não foi possível salvar a proposta.");
  const proposalId = saved.data.id as string;

  if (id) {
    const removed = await db.from("finance_proposal_items").delete().eq("proposal_id", proposalId);
    if (removed.error) return fail(removed.error, "Não foi possível atualizar os itens.");
  }
  const inserted = await db.from("finance_proposal_items").insert(itemRows(values.items).map((item) => ({ ...item, proposal_id: proposalId })));
  if (inserted.error) return fail(inserted.error, "Não foi possível salvar os itens.");

  if (values.contactId) {
    // Lead com proposta avança no funil (sem regredir quem já está à frente).
    await db.from("contacts").update({ status: "proposal" }).eq("id", values.contactId).in("status", ["new", "contacted", "qualified"]);
  }

  const { data, error } = await db.from("finance_proposals").select(proposalSelect).eq("id", proposalId).single();
  return error || !data ? fail(error, "Proposta salva, mas não foi possível recarregar.") : ok(mapProposal(data));
}

export async function setProposalStatus(id: string, status: Exclude<ProposalStatus, "accepted">): Promise<Result<true>> {
  const db = await financeDb();
  const { error } = await db.from("finance_proposals").update({ status }).eq("id", id).neq("status", "accepted");
  return error ? fail(error, "Não foi possível atualizar a proposta.") : ok(true);
}

export async function deleteProposal(id: string): Promise<Result<true>> {
  const db = await financeDb();
  const { error } = await db.from("finance_proposals").delete().eq("id", id);
  return error ? fail(error, "Não foi possível excluir a proposta.") : ok(true);
}

export async function acceptProposal(id: string, values: { startDate: string; dueDay: number; sellerId?: string }): Promise<Result<string>> {
  const db = await financeDb();
  const { data, error } = await db.rpc("finance_accept_proposal", {
    p_proposal_id: id,
    p_start_date: values.startDate,
    p_due_day: values.dueDay,
    p_seller_id: blank(values.sellerId),
  });
  return error || !data ? fail(error, "Não foi possível aceitar a proposta.") : ok(data as string);
}

// ---------------------------------------------------------------------------
// Contratos
// ---------------------------------------------------------------------------

const contractSelect = `*, items:finance_contract_items(*), customer:finance_customers(id, name),
  seller:profiles!finance_contracts_seller_id_fkey(${profileCols})`;

function mapContract(row: Row): Contract {
  return {
    id: row.id as string,
    title: row.title as string,
    customerId: row.customer_id as string,
    customerName: one(row.customer as { name: string } | null)?.name ?? "—",
    proposalId: (row.proposal_id as string | null) ?? null,
    sellerId: (row.seller_id as string | null) ?? null,
    sellerName: personName(one(row.seller as ProfileJoin)),
    status: row.status as ContractStatus,
    startDate: row.start_date as string,
    endDate: (row.end_date as string | null) ?? null,
    dueDay: num(row.due_day),
    monthlyAmountCents: num(row.monthly_amount_cents),
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    items: sortByPosition(row.items as Row[]).map((item) => ({ ...mapItem(item), firstDueDate: (item.first_due_date as string | null) ?? null }) satisfies ContractItem),
  };
}

export async function listContracts(): Promise<Contract[]> {
  const db = await financeDb();
  const { data } = await db.from("finance_contracts").select(contractSelect).order("created_at", { ascending: false });
  return (data ?? []).map(mapContract);
}

export async function getContract(id: string): Promise<Contract | null> {
  const db = await financeDb();
  const { data } = await db.from("finance_contracts").select(contractSelect).eq("id", id).maybeSingle();
  return data ? mapContract(data) : null;
}

export async function saveContract(id: string | null, values: ContractValues): Promise<Result<string>> {
  const db = await financeDb();
  const row = {
    title: values.title.trim(),
    customer_id: values.customerId,
    seller_id: blank(values.sellerId),
    status: values.status,
    start_date: values.startDate,
    end_date: blank(values.endDate),
    due_day: values.dueDay,
    notes: blank(values.notes),
  };
  const saved = id
    ? await db.from("finance_contracts").update(row).eq("id", id).select("id").single()
    : await db.from("finance_contracts").insert(row).select("id").single();
  if (saved.error || !saved.data) return fail(saved.error, "Não foi possível salvar o contrato.");
  const contractId = saved.data.id as string;

  // Itens: atualiza os existentes (preserva o vínculo com parcelas já geradas), insere novos e remove os retirados.
  const existing = await db.from("finance_contract_items").select("id").eq("contract_id", contractId);
  if (existing.error) return fail(existing.error, "Não foi possível ler os itens.");
  const rows = itemRows(values.items);
  const keep = new Set<string>();
  for (const [index, item] of values.items.entries()) {
    const payload = { ...rows[index], first_due_date: item.billingType === "one_off" ? blank(item.firstDueDate) : null, contract_id: contractId };
    const itemId = item.id;
    if (itemId && existing.data.some((current) => current.id === itemId)) {
      keep.add(itemId);
      const updated = await db.from("finance_contract_items").update(payload).eq("id", itemId);
      if (updated.error) return fail(updated.error, "Não foi possível salvar os itens.");
    } else {
      const inserted = await db.from("finance_contract_items").insert(payload);
      if (inserted.error) return fail(inserted.error, "Não foi possível salvar os itens.");
    }
  }
  const removed = existing.data.map((item) => item.id as string).filter((itemId) => !keep.has(itemId));
  if (removed.length) {
    const deleted = await db.from("finance_contract_items").delete().in("id", removed);
    if (deleted.error) return fail(deleted.error, "Não foi possível remover itens.");
  }
  return ok(contractId);
}

export async function setContractStatus(id: string, status: ContractStatus, endDate?: string): Promise<Result<true>> {
  const db = await financeDb();
  const row: Row = { status };
  if (endDate) row.end_date = endDate;
  const { error } = await db.from("finance_contracts").update(row).eq("id", id);
  if (error) return fail(error, "Não foi possível atualizar o contrato.");
  if (status === "cancelled") {
    await db.from("finance_receivables").update({ status: "cancelled" }).eq("contract_id", id).eq("status", "open");
  }
  return ok(true);
}

export async function deleteContract(id: string): Promise<Result<true>> {
  const db = await financeDb();
  const { error } = await db.from("finance_contracts").delete().eq("id", id);
  return error ? fail(error, "Não foi possível excluir o contrato.") : ok(true);
}

// ---------------------------------------------------------------------------
// Parcelas
// ---------------------------------------------------------------------------

const receivableSelect = "*, contract:finance_contracts(id, title, customer:finance_customers(name))";

function mapReceivable(row: Row): Receivable {
  const contract = one<Row>(row.contract as Row | null);
  return {
    id: row.id as string,
    contractId: row.contract_id as string,
    contractTitle: (contract?.title as string | null) ?? null,
    customerName: one(contract?.customer as { name: string } | null)?.name ?? null,
    contractItemId: (row.contract_item_id as string | null) ?? null,
    sourceKey: row.source_key as string,
    kind: row.kind as BillingType,
    competence: row.competence as string,
    dueDate: row.due_date as string,
    amountCents: num(row.amount_cents),
    installmentNumber: row.installment_number == null ? null : num(row.installment_number),
    installmentsTotal: row.installments_total == null ? null : num(row.installments_total),
    status: row.status as ReceivableStatus,
    paidAt: (row.paid_at as string | null) ?? null,
    paidAmountCents: row.paid_amount_cents == null ? null : num(row.paid_amount_cents),
    notes: (row.notes as string | null) ?? null,
  };
}

export async function listReceivables(filter: { contractId?: string; from?: IsoDate; to?: IsoDate; status?: ReceivableStatus[] } = {}): Promise<Receivable[]> {
  const db = await financeDb();
  let query = db.from("finance_receivables").select(receivableSelect).order("due_date", { ascending: true });
  if (filter.contractId) query = query.eq("contract_id", filter.contractId);
  if (filter.from) query = query.gte("competence", filter.from);
  if (filter.to) query = query.lte("competence", filter.to);
  if (filter.status?.length) query = query.in("status", filter.status);
  const { data } = await query.limit(5000);
  return (data ?? []).map(mapReceivable);
}

/** Recebimentos pagos com data de pagamento no intervalo (regime de caixa). */
export async function listPaidReceivables(from: IsoDate, to: IsoDate) {
  const db = await financeDb();
  const { data } = await db
    .from("finance_receivables")
    .select("paid_at, paid_amount_cents, amount_cents, contract_id, contract:finance_contracts(seller_id, customer:finance_customers(id, name))")
    .eq("status", "paid")
    .gte("paid_at", from)
    .lte("paid_at", to)
    .limit(10000);
  return ((data ?? []) as Row[]).map((row) => {
    const contract = one<Row>(row.contract as Row | null);
    const customer = one(contract?.customer as { id: string; name: string } | null);
    return {
      paidAt: row.paid_at as string,
      amountCents: row.paid_amount_cents == null ? num(row.amount_cents) : num(row.paid_amount_cents),
      sellerId: (contract?.seller_id as string | null) ?? null,
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? null,
    };
  });
}

export async function generateReceivables(month: IsoDate, contractId?: string): Promise<Result<{ created: number }>> {
  const db = await financeDb();
  let query = db.from("finance_contracts").select("id, status, start_date, end_date, due_day, items:finance_contract_items(*)").neq("status", "cancelled");
  if (contractId) query = query.eq("id", contractId);
  const { data, error } = await query;
  if (error) return fail(error, "Não foi possível ler os contratos.");
  const contracts: BillableContract[] = ((data ?? []) as Row[]).map((row) => ({
    id: row.id as string,
    status: row.status as ContractStatus,
    startDate: row.start_date as string,
    endDate: (row.end_date as string | null) ?? null,
    dueDay: num(row.due_day),
    items: ((row.items as Row[]) ?? []).map((item) => ({ ...mapItem(item), firstDueDate: (item.first_due_date as string | null) ?? null })),
  }));
  const drafts = receivablesForMonth(contracts, month);
  if (!drafts.length) return ok({ created: 0 });
  const inserted = await db
    .from("finance_receivables")
    .upsert(drafts, { onConflict: "contract_id,source_key,competence", ignoreDuplicates: true })
    .select("id");
  if (inserted.error) return fail(inserted.error, "Não foi possível gerar as parcelas.");
  return ok({ created: inserted.data?.length ?? 0 });
}

export async function updateReceivable(
  id: string,
  action: { action: "pay"; paidAt: string; paidAmount: number | null } | { action: "reopen" } | { action: "cancel" },
): Promise<Result<true>> {
  const db = await financeDb();
  const row =
    action.action === "pay"
      ? { status: "paid", paid_at: action.paidAt, paid_amount_cents: action.paidAmount == null ? null : reaisToCents(action.paidAmount) }
      : action.action === "reopen"
        ? { status: "open", paid_at: null, paid_amount_cents: null }
        : { status: "cancelled", paid_at: null, paid_amount_cents: null };
  const { error } = await db.from("finance_receivables").update(row).eq("id", id);
  return error ? fail(error, "Não foi possível atualizar a parcela.") : ok(true);
}

// ---------------------------------------------------------------------------
// Folha
// ---------------------------------------------------------------------------

function mapRun(row: Row): PayrollRun {
  return { id: row.id as string, competence: row.competence as string, status: row.status as PayrollStatus, notes: (row.notes as string | null) ?? null };
}

function mapPayrollItem(row: Row): PayrollItem {
  return {
    id: row.id as string,
    runId: row.run_id as string,
    userId: (row.user_id as string | null) ?? null,
    employeeName: row.employee_name as string,
    contractType: (row.contract_type as string | null) ?? null,
    paymentDay: row.payment_day == null ? null : num(row.payment_day),
    baseCents: num(row.base_cents),
    commissionCents: num(row.commission_cents),
    additionalCents: num(row.additional_cents),
    bonusCents: num(row.bonus_cents),
    deductionCents: num(row.deduction_cents),
    totalCents: num(row.total_cents),
    paidAt: (row.paid_at as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
  };
}

export async function listPayrollRuns(): Promise<PayrollRun[]> {
  const db = await financeDb();
  const { data } = await db.from("finance_payroll_runs").select("*").order("competence", { ascending: false });
  return (data ?? []).map(mapRun);
}

export async function getPayroll(month: IsoDate): Promise<{ run: PayrollRun | null; items: PayrollItem[] }> {
  const db = await financeDb();
  const { data } = await db.from("finance_payroll_runs").select("*, items:finance_payroll_items(*)").eq("competence", monthStart(month)).maybeSingle();
  if (!data) return { run: null, items: [] };
  const items = ((data.items as Row[]) ?? []).map(mapPayrollItem).sort((a, b) => a.employeeName.localeCompare(b.employeeName, "pt-BR"));
  return { run: mapRun(data), items };
}

export async function listPaidPayroll(from: IsoDate, to: IsoDate) {
  const db = await financeDb();
  const { data } = await db.from("finance_payroll_items").select("paid_at, total_cents").not("paid_at", "is", null).gte("paid_at", from).lte("paid_at", to).limit(10000);
  return ((data ?? []) as Row[]).map((row) => ({ date: row.paid_at as string, amountCents: num(row.total_cents) }));
}

/**
 * Gera (ou regenera, se ainda em rascunho) a folha do mês a partir de employee_records.
 * Mantém bônus, descontos, observações e pagamentos já lançados.
 */
export async function buildPayrollRun(month: IsoDate): Promise<Result<{ runId: string; lines: number }>> {
  const db = await financeDb();
  const competence = monthStart(month);

  const existing = await db.from("finance_payroll_runs").select("id, status").eq("competence", competence).maybeSingle();
  if (existing.error) return fail(existing.error, "Não foi possível ler a folha.");
  if (existing.data && existing.data.status !== "draft") return fail(null, "A folha deste mês já foi fechada.");

  const employees = await db
    .from("employee_records")
    .select(`user_id, employment_status, contract_type, payment_model, fixed_amount_cents, commission_percent, additional_amount_cents, payment_day, profile:profiles!employee_records_user_id_fkey(${profileCols})`);
  if (employees.error) return fail(employees.error, "Não foi possível ler a remuneração da equipe.");

  const paid = await listPaidReceivables(competence, monthEnd(competence));
  const commissionBase = new Map<string, number>();
  for (const entry of paid) {
    if (!entry.sellerId) continue;
    commissionBase.set(entry.sellerId, (commissionBase.get(entry.sellerId) ?? 0) + entry.amountCents);
  }

  const records: CompensationRecord[] = ((employees.data ?? []) as Row[]).map((row) => ({
    userId: row.user_id as string,
    name: personName(one(row.profile as ProfileJoin)) ?? "Sem nome",
    employmentStatus: row.employment_status as "active" | "inactive",
    contractType: (row.contract_type as string | null) ?? null,
    paymentModel: (row.payment_model as CompensationRecord["paymentModel"]) ?? null,
    fixedAmountCents: row.fixed_amount_cents == null ? null : num(row.fixed_amount_cents),
    commissionPercent: row.commission_percent == null ? null : num(row.commission_percent),
    additionalAmountCents: row.additional_amount_cents == null ? null : num(row.additional_amount_cents),
    paymentDay: row.payment_day == null ? null : num(row.payment_day),
  }));
  const lines = buildPayroll(records, commissionBase);

  let runId = existing.data?.id as string | undefined;
  if (!runId) {
    const created = await db.from("finance_payroll_runs").insert({ competence }).select("id").single();
    if (created.error || !created.data) return fail(created.error, "Não foi possível criar a folha.");
    runId = created.data.id as string;
  }

  if (lines.length) {
    const upserted = await db
      .from("finance_payroll_items")
      .upsert(lines.map((line) => ({ ...line, run_id: runId })), { onConflict: "run_id,user_id" });
    if (upserted.error) return fail(upserted.error, "Não foi possível gerar a folha.");
  }
  return ok({ runId, lines: lines.length });
}

export async function updatePayrollItem(id: string, values: { bonus?: number | null; deduction?: number | null; notes?: string | null; paidAt?: string | null }): Promise<Result<true>> {
  const db = await financeDb();
  const row: Row = {};
  if (values.bonus !== undefined) row.bonus_cents = reaisToCents(values.bonus);
  if (values.deduction !== undefined) row.deduction_cents = reaisToCents(values.deduction);
  if (values.notes !== undefined) row.notes = values.notes;
  if (values.paidAt !== undefined) row.paid_at = values.paidAt;
  const { error } = await db.from("finance_payroll_items").update(row).eq("id", id);
  return error ? fail(error, "Não foi possível atualizar o lançamento.") : ok(true);
}

export async function setPayrollRunStatus(id: string, status: PayrollStatus, paidAt?: string): Promise<Result<true>> {
  const db = await financeDb();
  const { error } = await db.from("finance_payroll_runs").update({ status }).eq("id", id);
  if (error) return fail(error, "Não foi possível atualizar a folha.");
  if (status === "paid") {
    const marked = await db.from("finance_payroll_items").update({ paid_at: paidAt || new Date().toISOString().slice(0, 10) }).eq("run_id", id).is("paid_at", null);
    if (marked.error) return fail(marked.error, "Folha paga, mas não foi possível marcar os lançamentos.");
  }
  return ok(true);
}

export async function deletePayrollRun(id: string): Promise<Result<true>> {
  const db = await financeDb();
  const { error } = await db.from("finance_payroll_runs").delete().eq("id", id).eq("status", "draft");
  return error ? fail(error, "Não foi possível excluir a folha.") : ok(true);
}

// ---------------------------------------------------------------------------
// Despesas
// ---------------------------------------------------------------------------

export async function listExpenseCategories(): Promise<ExpenseCategory[]> {
  const db = await financeDb();
  const { data } = await db.from("finance_expense_categories").select("*").order("name");
  return ((data ?? []) as Row[]).map((row) => ({ id: row.id as string, name: row.name as string, active: Boolean(row.active) }));
}

export async function saveExpenseCategory(id: string | null, values: { name: string; active: boolean }): Promise<Result<true>> {
  const db = await financeDb();
  const row = { name: values.name.trim(), active: values.active };
  const { error } = id ? await db.from("finance_expense_categories").update(row).eq("id", id) : await db.from("finance_expense_categories").insert(row);
  return error ? fail(error, "Não foi possível salvar a categoria.") : ok(true);
}

export async function deleteExpenseCategory(id: string): Promise<Result<true>> {
  const db = await financeDb();
  const { error } = await db.from("finance_expense_categories").delete().eq("id", id);
  return error ? fail(error, "Não foi possível excluir a categoria.") : ok(true);
}

function mapExpense(row: Row): Expense {
  return {
    id: row.id as string,
    description: row.description as string,
    categoryId: (row.category_id as string | null) ?? null,
    categoryName: one(row.category as { name: string } | null)?.name ?? null,
    supplier: (row.supplier as string | null) ?? null,
    amountCents: num(row.amount_cents),
    competence: row.competence as string,
    dueDate: (row.due_date as string | null) ?? null,
    paidAt: (row.paid_at as string | null) ?? null,
    recurring: Boolean(row.recurring),
    notes: (row.notes as string | null) ?? null,
  };
}

export async function listExpenses(from: IsoDate, to: IsoDate): Promise<Expense[]> {
  const db = await financeDb();
  const { data } = await db
    .from("finance_expenses")
    .select("*, category:finance_expense_categories(name)")
    .gte("competence", monthStart(from))
    .lte("competence", monthStart(to))
    .order("competence", { ascending: false })
    .order("due_date", { ascending: true });
  return (data ?? []).map(mapExpense);
}

export async function listPaidExpenses(from: IsoDate, to: IsoDate) {
  const db = await financeDb();
  const { data } = await db.from("finance_expenses").select("paid_at, amount_cents").not("paid_at", "is", null).gte("paid_at", from).lte("paid_at", to).limit(10000);
  return ((data ?? []) as Row[]).map((row) => ({ date: row.paid_at as string, amountCents: num(row.amount_cents) }));
}

function expenseRow(values: ExpenseValues) {
  return {
    description: values.description.trim(),
    category_id: blank(values.categoryId),
    supplier: blank(values.supplier),
    amount_cents: reaisToCents(values.amount),
    competence: `${values.competence}-01`,
    due_date: blank(values.dueDate),
    paid_at: blank(values.paidAt),
    recurring: values.recurring,
    notes: blank(values.notes),
  };
}

export async function saveExpense(id: string | null, values: ExpenseValues): Promise<Result<true>> {
  const db = await financeDb();
  const { error } = id ? await db.from("finance_expenses").update(expenseRow(values)).eq("id", id) : await db.from("finance_expenses").insert(expenseRow(values));
  return error ? fail(error, "Não foi possível salvar a despesa.") : ok(true);
}

export async function deleteExpense(id: string): Promise<Result<true>> {
  const db = await financeDb();
  const { error } = await db.from("finance_expenses").delete().eq("id", id);
  return error ? fail(error, "Não foi possível excluir a despesa.") : ok(true);
}

/** Copia as despesas recorrentes do mês anterior para `month` (sem duplicar descrições já lançadas). */
export async function copyRecurringExpenses(month: IsoDate): Promise<Result<{ created: number }>> {
  const db = await financeDb();
  const target = monthStart(month);
  const previous = addMonths(target, -1);
  const [source, current] = await Promise.all([
    db.from("finance_expenses").select("*").eq("competence", previous).eq("recurring", true),
    db.from("finance_expenses").select("description").eq("competence", target),
  ]);
  if (source.error || current.error) return fail(source.error || current.error, "Não foi possível ler as despesas.");
  const existing = new Set(((current.data ?? []) as Row[]).map((row) => String(row.description).toLowerCase()));
  const rows = ((source.data ?? []) as Row[])
    .filter((row) => !existing.has(String(row.description).toLowerCase()))
    .map((row) => ({
      description: row.description,
      category_id: row.category_id,
      supplier: row.supplier,
      amount_cents: row.amount_cents,
      competence: target,
      due_date: row.due_date ? addMonths(row.due_date as string, 1) : null,
      recurring: true,
      notes: row.notes,
    }));
  if (!rows.length) return ok({ created: 0 });
  const { error } = await db.from("finance_expenses").insert(rows);
  return error ? fail(error, "Não foi possível copiar as despesas.") : ok({ created: rows.length });
}

// ---------------------------------------------------------------------------
// Configurações
// ---------------------------------------------------------------------------

export async function getFinanceSettings(): Promise<FinanceSettings> {
  const db = await financeDb();
  const { data } = await db.from("finance_settings").select("*").maybeSingle();
  return { defaultDueDay: num(data?.default_due_day) || 10, companyName: (data?.company_name as string | null) ?? null };
}

export async function saveFinanceSettings(values: { defaultDueDay: number; companyName?: string }): Promise<Result<true>> {
  const db = await financeDb();
  const { error } = await db.from("finance_settings").update({ default_due_day: values.defaultDueDay, company_name: blank(values.companyName) }).eq("id", true);
  return error ? fail(error, "Não foi possível salvar as configurações.") : ok(true);
}
