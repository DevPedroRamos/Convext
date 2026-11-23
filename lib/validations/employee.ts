import { z } from "zod";

export const employeeRoles = ["admin", "coordinator", "traffic", "creator", "commercial"] as const;
export const employmentStatuses = ["active", "inactive"] as const;
export const contractTypes = ["clt", "pj", "freelancer", "partner_admin"] as const;
export const paymentModels = ["fixed", "commission", "fixed_commission", "custom"] as const;

const optionalMoney = z.number().finite().min(0).max(100_000_000).nullable();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.");

export const employeePersonalSchema = z.object({
  firstName: z.string().trim().min(2, "Informe o nome.").max(80),
  lastName: z.string().trim().max(80),
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  phone: z.string().trim().max(30),
  role: z.enum(employeeRoles),
  cargo: z.string().trim().min(2, "Informe o cargo.").max(100),
});

export const employeeContractSchema = z.object({
  hiredOn: isoDate.nullable(),
  employmentStatus: z.enum(employmentStatuses),
  contractType: z.enum(contractTypes).nullable(),
});

export const employeeFinancialSchema = z.object({
  paymentModel: z.enum(paymentModels).nullable(),
  fixedAmount: optionalMoney,
  commissionPercent: z.number().finite().min(0).max(100).nullable(),
  additionalAmount: optionalMoney,
  paymentDay: z.number().int().min(1).max(31).nullable(),
});

export const employeeSchema = employeePersonalSchema
  .merge(employeeContractSchema)
  .merge(employeeFinancialSchema)
  .superRefine((values, context) => {
  if (values.paymentModel === "fixed" && !values.fixedAmount) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["fixedAmount"], message: "Informe o valor fixo." });
  }
  if (values.paymentModel === "commission" && !values.commissionPercent) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["commissionPercent"], message: "Informe a comissão." });
  }
  if (values.paymentModel === "fixed_commission") {
    if (!values.fixedAmount) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["fixedAmount"], message: "Informe o valor fixo." });
    }
    if (!values.commissionPercent) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["commissionPercent"], message: "Informe a comissão." });
    }
  }
  });

export type EmployeeValues = z.infer<typeof employeeSchema>;
export type EmployeeRole = (typeof employeeRoles)[number];
export type EmploymentStatus = (typeof employmentStatuses)[number];
export type ContractType = (typeof contractTypes)[number];
export type PaymentModel = (typeof paymentModels)[number];

export function canManageEmployeeRole(role: string | null | undefined) {
  return role !== "admin";
}

export function inviteAccessRole(role: EmployeeRole, cargo: string): EmployeeRole {
  return role === "admin" || cargo.trim().toLowerCase() === "admin" ? "admin" : role;
}
