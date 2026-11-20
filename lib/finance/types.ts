import type { IsoDate } from "@/lib/finance/dates";

export type BillingType = "recurring" | "one_off";

export const LEAD_STATUSES = ["new", "contacted", "qualified", "proposal", "won", "lost", "archived"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = ["landing", "manual", "referral", "whatsapp", "other"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const PROPOSAL_STATUSES = ["draft", "sent", "accepted", "rejected", "expired"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const CONTRACT_STATUSES = ["active", "paused", "ended", "cancelled"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const RECEIVABLE_STATUSES = ["open", "paid", "cancelled"] as const;
export type ReceivableStatus = (typeof RECEIVABLE_STATUSES)[number];

export const PAYROLL_STATUSES = ["draft", "closed", "paid"] as const;
export type PayrollStatus = (typeof PAYROLL_STATUSES)[number];

export type ProfileRef = { id: string; name: string };

export type Lead = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  inquiryType: string | null;
  status: LeadStatus;
  source: LeadSource;
  assigneeId: string | null;
  assigneeName: string | null;
  estimatedValueCents: number | null;
  lostReason: string | null;
  notes: string | null;
  convertedCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  billingType: BillingType;
  defaultPriceCents: number;
  active: boolean;
};

export type Customer = {
  id: string;
  name: string;
  legalName: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  clientId: string | null;
  clientName: string | null;
  contactId: string | null;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: string;
};

export type LineItem = {
  id?: string;
  productId: string | null;
  description: string;
  billingType: BillingType;
  quantity: number;
  unitPriceCents: number;
  installments: number;
};

export type Proposal = {
  id: string;
  title: string;
  customerId: string | null;
  customerName: string | null;
  contactId: string | null;
  contactName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  status: ProposalStatus;
  validUntil: IsoDate | null;
  notes: string | null;
  acceptedAt: string | null;
  createdAt: string;
  items: LineItem[];
  recurringCents: number;
  oneOffCents: number;
};

export type ContractItem = LineItem & { id: string; firstDueDate: IsoDate | null };

export type Contract = {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  proposalId: string | null;
  sellerId: string | null;
  sellerName: string | null;
  status: ContractStatus;
  startDate: IsoDate;
  endDate: IsoDate | null;
  dueDay: number;
  monthlyAmountCents: number;
  notes: string | null;
  createdAt: string;
  items: ContractItem[];
};

export type Receivable = {
  id: string;
  contractId: string;
  contractTitle: string | null;
  customerName: string | null;
  contractItemId: string | null;
  sourceKey: string;
  kind: BillingType;
  competence: IsoDate;
  dueDate: IsoDate;
  amountCents: number;
  installmentNumber: number | null;
  installmentsTotal: number | null;
  status: ReceivableStatus;
  paidAt: IsoDate | null;
  paidAmountCents: number | null;
  notes: string | null;
};

export type PayrollRun = {
  id: string;
  competence: IsoDate;
  status: PayrollStatus;
  notes: string | null;
};

export type PayrollItem = {
  id: string;
  runId: string;
  userId: string | null;
  employeeName: string;
  contractType: string | null;
  paymentDay: number | null;
  baseCents: number;
  commissionCents: number;
  additionalCents: number;
  bonusCents: number;
  deductionCents: number;
  totalCents: number;
  paidAt: IsoDate | null;
  notes: string | null;
};

export type ExpenseCategory = { id: string; name: string; active: boolean };

export type Expense = {
  id: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  supplier: string | null;
  amountCents: number;
  competence: IsoDate;
  dueDate: IsoDate | null;
  paidAt: IsoDate | null;
  recurring: boolean;
  notes: string | null;
};

export type FinanceSettings = { defaultDueDay: number; companyName: string | null };
