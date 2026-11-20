import { contractCoversMonth } from "@/lib/finance/receivables";
import { monthStart, type IsoDate } from "@/lib/finance/dates";
import { percent } from "@/lib/finance/money";
import type { ContractStatus, LeadStatus } from "@/lib/finance/types";

export type CashflowMonth = {
  month: IsoDate;
  revenueCents: number;
  payrollCents: number;
  expensesCents: number;
  resultCents: number;
};

type Dated = { date: IsoDate | null; amountCents: number };

function bucket(months: IsoDate[], entries: Dated[]) {
  const totals = new Map(months.map((month) => [month, 0]));
  for (const entry of entries) {
    if (!entry.date) continue;
    const key = monthStart(entry.date);
    if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + entry.amountCents);
  }
  return totals;
}

/** Fluxo de caixa (regime de caixa): agrupa pelo mês da data de pagamento. */
export function cashflow(months: IsoDate[], input: { revenue: Dated[]; payroll: Dated[]; expenses: Dated[] }): CashflowMonth[] {
  const revenue = bucket(months, input.revenue);
  const payroll = bucket(months, input.payroll);
  const expenses = bucket(months, input.expenses);
  return months.map((month) => {
    const r = revenue.get(month) ?? 0;
    const p = payroll.get(month) ?? 0;
    const e = expenses.get(month) ?? 0;
    return { month, revenueCents: r, payrollCents: p, expensesCents: e, resultCents: r - p - e };
  });
}

export type MrrContract = {
  status: ContractStatus;
  startDate: IsoDate;
  endDate: IsoDate | null;
  monthlyAmountCents: number;
};

/**
 * MRR por mês: soma das mensalidades dos contratos vigentes no mês.
 * Contratos cancelados não contam; pausados contam apenas a partir de hoje (não faturam).
 */
export function mrrSeries(months: IsoDate[], contracts: MrrContract[], currentMonth: IsoDate) {
  const current = monthStart(currentMonth);
  return months.map((month) => ({
    month,
    mrrCents: contracts
      .filter((contract) => contract.status !== "cancelled")
      .filter((contract) => !(contract.status === "paused" && month >= current))
      .filter((contract) => contractCoversMonth(contract, month))
      .reduce((sum, contract) => sum + contract.monthlyAmountCents, 0),
  }));
}

export const FUNNEL_STAGES: LeadStatus[] = ["new", "contacted", "qualified", "proposal", "won"];

/** Quantos leads chegaram (ou passaram) por cada etapa do funil. Perdidos/arquivados contam só no total. */
export function funnel(statuses: LeadStatus[]) {
  const rank = new Map(FUNNEL_STAGES.map((stage, index) => [stage, index]));
  return FUNNEL_STAGES.map((stage, index) => ({
    stage,
    count: statuses.filter((status) => (rank.get(status) ?? -1) >= index).length,
  }));
}

export function conversionRate(statuses: LeadStatus[]) {
  const decided = statuses.filter((status) => status === "won" || status === "lost").length;
  const won = statuses.filter((status) => status === "won").length;
  return percent(won, decided);
}
