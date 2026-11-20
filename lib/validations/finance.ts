import { z } from "zod";
import { CONTRACT_STATUSES, LEAD_SOURCES, LEAD_STATUSES, PROPOSAL_STATUSES } from "@/lib/finance/types";

const optionalText = z.string().trim().max(2000).optional().or(z.literal(""));
const optionalUuid = z.string().uuid("Seleção inválida.").optional().or(z.literal(""));
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");
const optionalDate = isoDate.optional().or(z.literal(""));
const money = z.coerce.number({ invalid_type_error: "Informe um valor." }).min(0, "Valor não pode ser negativo.").max(100_000_000);
const optionalMoney = z.preprocess((value) => (value === "" || value == null ? null : value), money.nullable());
const billingType = z.enum(["recurring", "one_off"]);

export const leadSchema = z.object({
  firstName: z.string().trim().min(2, "Informe o nome."),
  lastName: optionalText,
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  phone: optionalText,
  company: optionalText,
  source: z.enum(LEAD_SOURCES),
  status: z.enum(LEAD_STATUSES),
  assigneeId: optionalUuid,
  estimatedValue: optionalMoney,
  notes: optionalText,
  lostReason: optionalText,
});
export type LeadValues = z.infer<typeof leadSchema>;

export const leadPatchSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  lostReason: z.string().trim().max(2000).nullable().optional(),
});

export const convertLeadSchema = z.object({
  name: optionalText,
  document: optionalText,
  clientId: optionalUuid,
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do produto."),
  description: optionalText,
  billingType,
  defaultPrice: money,
  active: z.boolean().default(true),
});
export type ProductValues = z.infer<typeof productSchema>;

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome."),
  legalName: optionalText,
  document: optionalText,
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  phone: optionalText,
  address: optionalText,
  notes: optionalText,
  clientId: optionalUuid,
  ownerId: optionalUuid,
});
export type CustomerValues = z.infer<typeof customerSchema>;

export const lineItemSchema = z.object({
  productId: optionalUuid,
  description: z.string().trim().min(2, "Descreva o item."),
  billingType,
  quantity: z.coerce.number().int().min(1, "Mínimo 1."),
  unitPrice: money,
  installments: z.coerce.number().int().min(1).max(60),
});
export type LineItemValues = z.infer<typeof lineItemSchema>;

export const proposalSchema = z
  .object({
    title: z.string().trim().min(2, "Informe o título."),
    customerId: optionalUuid,
    contactId: optionalUuid,
    ownerId: optionalUuid,
    status: z.enum(PROPOSAL_STATUSES).refine((status) => status !== "accepted", "Use “Aceitar proposta” para gerar o contrato."),
    validUntil: optionalDate,
    notes: optionalText,
    items: z.array(lineItemSchema).min(1, "Adicione ao menos um item."),
  })
  .refine((values) => Boolean(values.customerId || values.contactId), {
    path: ["customerId"],
    message: "Escolha um cliente ou um lead.",
  });
export type ProposalValues = z.infer<typeof proposalSchema>;

export const acceptProposalSchema = z.object({
  startDate: isoDate,
  dueDay: z.coerce.number().int().min(1).max(31),
  sellerId: optionalUuid,
});

export const contractSchema = z
  .object({
    title: z.string().trim().min(2, "Informe o título."),
    customerId: z.string().uuid("Escolha o cliente."),
    sellerId: optionalUuid,
    status: z.enum(CONTRACT_STATUSES),
    startDate: isoDate,
    endDate: optionalDate,
    dueDay: z.coerce.number().int().min(1).max(31),
    notes: optionalText,
    items: z.array(lineItemSchema.extend({ id: z.string().uuid().optional(), firstDueDate: optionalDate })).min(1, "Adicione ao menos um item."),
  })
  .refine((values) => !values.endDate || values.endDate >= values.startDate, {
    path: ["endDate"],
    message: "O fim deve ser depois do início.",
  });
export type ContractValues = z.infer<typeof contractSchema>;

export const proposalStatusSchema = z.object({ status: z.enum(["draft", "sent", "rejected", "expired"]) });

export const contractStatusSchema = z.object({ status: z.enum(CONTRACT_STATUSES), endDate: optionalDate });

export const generateReceivablesSchema = z.object({ month: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, "Mês inválido.") });

export const receivablePatchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("pay"), paidAt: isoDate, paidAmount: optionalMoney }),
  z.object({ action: z.literal("reopen") }),
  z.object({ action: z.literal("cancel") }),
]);

export const payrollBuildSchema = generateReceivablesSchema;

export const payrollItemPatchSchema = z.object({
  bonus: optionalMoney,
  deduction: optionalMoney,
  notes: z.string().trim().max(2000).nullable().optional(),
  paidAt: isoDate.nullable().optional(),
});

export const payrollRunPatchSchema = z.object({
  status: z.enum(["draft", "closed", "paid"]),
  paidAt: optionalDate,
});

export const expenseSchema = z.object({
  description: z.string().trim().min(2, "Descreva a despesa."),
  categoryId: optionalUuid,
  supplier: optionalText,
  amount: money,
  competence: z.string().regex(/^\d{4}-\d{2}$/, "Competência inválida."),
  dueDate: optionalDate,
  paidAt: optionalDate,
  recurring: z.boolean().default(false),
  notes: optionalText,
});
export type ExpenseValues = z.infer<typeof expenseSchema>;

export const expenseCategorySchema = z.object({ name: z.string().trim().min(2, "Informe o nome."), active: z.boolean().default(true) });

export const financeSettingsSchema = z.object({
  defaultDueDay: z.coerce.number().int().min(1).max(31),
  companyName: optionalText,
});
