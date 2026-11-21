import { addMonths, dayInMonth, monthEnd, monthStart, type IsoDate } from "@/lib/finance/dates";
import { splitCents } from "@/lib/finance/money";
import type { BillingType, ContractStatus, Receivable } from "@/lib/finance/types";

export type BillableItem = {
  id: string;
  billingType: BillingType;
  quantity: number;
  unitPriceCents: number;
  installments: number;
  firstDueDate: IsoDate | null;
};

export type BillableContract = {
  id: string;
  status: ContractStatus;
  startDate: IsoDate;
  endDate: IsoDate | null;
  dueDay: number;
  items: BillableItem[];
};

export type ReceivableDraft = {
  contract_id: string;
  contract_item_id: string | null;
  source_key: string;
  kind: BillingType;
  competence: IsoDate;
  due_date: IsoDate;
  amount_cents: number;
  installment_number: number | null;
  installments_total: number | null;
};

export const RECURRING_SOURCE_KEY = "recurring";

export function itemTotalCents(item: Pick<BillableItem, "quantity" | "unitPriceCents">) {
  return item.quantity * item.unitPriceCents;
}

export function recurringTotalCents(items: Pick<BillableItem, "billingType" | "quantity" | "unitPriceCents">[]) {
  return items.filter((item) => item.billingType === "recurring").reduce((sum, item) => sum + itemTotalCents(item), 0);
}

/** Contrato vigente em algum dia do mês da competência. */
export function contractCoversMonth(contract: Pick<BillableContract, "startDate" | "endDate">, month: IsoDate) {
  const start = monthStart(month);
  return contract.startDate <= monthEnd(start) && (!contract.endDate || contract.endDate >= start);
}

/**
 * Parcelas devidas na competência `month`:
 * - mensalidade (soma dos itens recorrentes) para contratos ativos vigentes no mês;
 * - parcelas de itens avulsos cuja competência cai no mês (contratos não cancelados).
 * A geração é idempotente no banco por (contract_id, source_key, competence).
 */
export function receivablesForMonth(contracts: BillableContract[], month: IsoDate): ReceivableDraft[] {
  const competence = monthStart(month);
  const drafts: ReceivableDraft[] = [];

  for (const contract of contracts) {
    if (contract.status === "cancelled") continue;

    const recurring = recurringTotalCents(contract.items);
    if (contract.status === "active" && recurring > 0 && contractCoversMonth(contract, competence)) {
      let due = dayInMonth(competence, contract.dueDay);
      // No mês de início, um vencimento anterior ao início vai para o mês seguinte.
      if (due < contract.startDate) due = dayInMonth(addMonths(competence, 1), contract.dueDay);
      drafts.push({
        contract_id: contract.id,
        contract_item_id: null,
        source_key: RECURRING_SOURCE_KEY,
        kind: "recurring",
        competence,
        due_date: due,
        amount_cents: recurring,
        installment_number: null,
        installments_total: null,
      });
    }

    for (const item of contract.items) {
      if (item.billingType !== "one_off") continue;
      const firstDue = item.firstDueDate ?? dayInMonth(contract.startDate, contract.dueDay);
      const amounts = splitCents(itemTotalCents(item), item.installments);
      amounts.forEach((amount, index) => {
        const due = addMonths(firstDue, index);
        if (monthStart(due) !== competence) return;
        drafts.push({
          contract_id: contract.id,
          contract_item_id: item.id,
          source_key: `${item.id}:${index + 1}`,
          kind: "one_off",
          competence,
          due_date: due,
          amount_cents: amount,
          installment_number: index + 1,
          installments_total: amounts.length,
        });
      });
    }
  }

  return drafts;
}

export function receivableDisplayStatus(receivable: Pick<Receivable, "status" | "dueDate">, today: IsoDate) {
  if (receivable.status === "open" && receivable.dueDate < today) return "overdue" as const;
  return receivable.status;
}
