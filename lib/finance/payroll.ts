import { percentOf } from "@/lib/finance/money";

export type CompensationRecord = {
  userId: string;
  name: string;
  employmentStatus: "active" | "inactive";
  contractType: string | null;
  paymentModel: "fixed" | "commission" | "fixed_commission" | "custom" | null;
  fixedAmountCents: number | null;
  commissionPercent: number | null;
  additionalAmountCents: number | null;
  paymentDay: number | null;
};

export type PayrollDraft = {
  user_id: string;
  employee_name: string;
  contract_type: string | null;
  payment_day: number | null;
  base_cents: number;
  commission_cents: number;
  additional_cents: number;
};

const paysFixed = new Set(["fixed", "fixed_commission", "custom"]);
const paysCommission = new Set(["commission", "fixed_commission", "custom"]);

/**
 * Linha da folha a partir da remuneração cadastrada em employee_records.
 * `commissionBaseCents` = recebimentos pagos no mês dos contratos em que a pessoa é vendedora.
 * Sem modelo definido, paga o fixo cadastrado e a comissão se houver percentual.
 */
export function payrollLine(record: CompensationRecord, commissionBaseCents: number): PayrollDraft {
  const model = record.paymentModel;
  const fixed = model == null || paysFixed.has(model) ? (record.fixedAmountCents ?? 0) : 0;
  const commission = model == null || paysCommission.has(model) ? percentOf(commissionBaseCents, record.commissionPercent) : 0;
  return {
    user_id: record.userId,
    employee_name: record.name,
    contract_type: record.contractType,
    payment_day: record.paymentDay,
    base_cents: fixed,
    commission_cents: commission,
    additional_cents: record.additionalAmountCents ?? 0,
  };
}

export function buildPayroll(records: CompensationRecord[], commissionBaseByUser: Map<string, number>) {
  return records
    .filter((record) => record.employmentStatus === "active")
    .map((record) => payrollLine(record, commissionBaseByUser.get(record.userId) ?? 0))
    .filter((line) => line.base_cents + line.commission_cents + line.additional_cents > 0);
}

export function payrollItemTotal(item: { baseCents: number; commissionCents: number; additionalCents: number; bonusCents: number; deductionCents: number }) {
  return item.baseCents + item.commissionCents + item.additionalCents + item.bonusCents - item.deductionCents;
}
