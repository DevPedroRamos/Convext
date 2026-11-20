import { describe, expect, it } from "vitest";
import { addMonths, dayInMonth, monthRange, parseMonth } from "@/lib/finance/dates";
import { cashflow, conversionRate, funnel, mrrSeries } from "@/lib/finance/metrics";
import { formatCents, reaisToCents, splitCents } from "@/lib/finance/money";
import { buildPayroll, payrollLine, type CompensationRecord } from "@/lib/finance/payroll";
import { receivableDisplayStatus, receivablesForMonth, type BillableContract } from "@/lib/finance/receivables";
import { contractSchema, proposalSchema } from "@/lib/validations/finance";

describe("datas do financeiro", () => {
  it("limita o dia ao fim do mês", () => {
    expect(dayInMonth("2027-02-01", 31)).toBe("2027-02-28");
    expect(dayInMonth("2028-02-01", 30)).toBe("2028-02-29");
  });

  it("soma meses a partir da data original, sem acumular o corte do dia", () => {
    expect(addMonths("2027-01-31", 1)).toBe("2027-02-28");
    expect(addMonths("2027-01-31", 2)).toBe("2027-03-31");
    expect(addMonths("2026-11-10", 2)).toBe("2027-01-10");
  });

  it("gera intervalos de meses e interpreta competências", () => {
    expect(monthRange("2026-11-20", 3)).toEqual(["2026-09-01", "2026-10-01", "2026-11-01"]);
    expect(parseMonth("2026-07", "2026-11-20")).toBe("2026-07-01");
    expect(parseMonth("lixo", "2026-11-20")).toBe("2026-11-01");
  });
});

describe("dinheiro", () => {
  it("divide parcelas sem perder centavos", () => {
    expect(splitCents(100_000, 3)).toEqual([33_333, 33_333, 33_334]);
    expect(splitCents(100_000, 3).reduce((a, b) => a + b, 0)).toBe(100_000);
  });

  it("converte e formata em BRL", () => {
    expect(reaisToCents(1499.9)).toBe(149_990);
    expect(formatCents(149_990).replace(/\s/g, " ")).toBe("R$ 1.499,90");
  });
});

const contract: BillableContract = {
  id: "c1",
  status: "active",
  startDate: "2026-11-25",
  endDate: null,
  dueDay: 10,
  items: [
    { id: "i1", billingType: "recurring", quantity: 1, unitPriceCents: 300_000, installments: 1, firstDueDate: null },
    { id: "i2", billingType: "recurring", quantity: 2, unitPriceCents: 50_000, installments: 1, firstDueDate: null },
    { id: "i3", billingType: "one_off", quantity: 1, unitPriceCents: 150_000, installments: 3, firstDueDate: "2026-12-10" },
  ],
};

describe("parcelas a receber", () => {
  it("cobra a mensalidade somando os itens recorrentes", () => {
    const [recurring] = receivablesForMonth([contract], "2027-01-01").filter((r) => r.kind === "recurring");
    expect(recurring.amount_cents).toBe(400_000);
    expect(recurring.due_date).toBe("2027-01-10");
    expect(recurring.source_key).toBe("recurring");
  });

  it("joga o vencimento anterior ao início para o mês seguinte", () => {
    const [recurring] = receivablesForMonth([contract], "2026-11-01");
    expect(recurring.due_date).toBe("2026-12-10");
    expect(recurring.competence).toBe("2026-11-01");
  });

  it("gera cada parcela avulsa só na sua competência", () => {
    expect(receivablesForMonth([contract], "2026-11-01").filter((r) => r.kind === "one_off")).toHaveLength(0);
    const dec = receivablesForMonth([contract], "2026-12-01").filter((r) => r.kind === "one_off");
    const feb = receivablesForMonth([contract], "2027-02-01").filter((r) => r.kind === "one_off");
    expect(dec).toEqual([expect.objectContaining({ installment_number: 1, amount_cents: 50_000, due_date: "2026-12-10", source_key: "i3:1" })]);
    expect(feb).toEqual([expect.objectContaining({ installment_number: 3, installments_total: 3, amount_cents: 50_000 })]);
    expect(receivablesForMonth([contract], "2027-03-01").filter((r) => r.kind === "one_off")).toHaveLength(0);
  });

  it("não cobra mensalidade fora da vigência, pausado ou cancelado", () => {
    expect(receivablesForMonth([{ ...contract, endDate: "2026-12-31" }], "2027-01-01").filter((r) => r.kind === "recurring")).toHaveLength(0);
    expect(receivablesForMonth([{ ...contract, status: "paused" }], "2027-01-01").filter((r) => r.kind === "recurring")).toHaveLength(0);
    expect(receivablesForMonth([{ ...contract, status: "cancelled" }], "2026-12-01")).toHaveLength(0);
  });

  it("mantém parcelas avulsas de contrato pausado", () => {
    expect(receivablesForMonth([{ ...contract, status: "paused" }], "2026-12-01")).toHaveLength(1);
  });

  it("marca como vencida a parcela aberta com vencimento passado", () => {
    expect(receivableDisplayStatus({ status: "open", dueDate: "2026-11-10" }, "2026-11-20")).toBe("overdue");
    expect(receivableDisplayStatus({ status: "paid", dueDate: "2026-11-10" }, "2026-11-20")).toBe("paid");
  });
});

const employee: CompensationRecord = {
  userId: "u1",
  name: "Ana",
  employmentStatus: "active",
  contractType: "pj",
  paymentModel: "fixed_commission",
  fixedAmountCents: 300_000,
  commissionPercent: 5,
  additionalAmountCents: 25_000,
  paymentDay: 5,
};

describe("folha", () => {
  it("soma fixo, comissão sobre recebimentos e adicional", () => {
    expect(payrollLine(employee, 1_000_000)).toMatchObject({ base_cents: 300_000, commission_cents: 50_000, additional_cents: 25_000 });
  });

  it("respeita o modelo de pagamento", () => {
    expect(payrollLine({ ...employee, paymentModel: "fixed" }, 1_000_000).commission_cents).toBe(0);
    expect(payrollLine({ ...employee, paymentModel: "commission" }, 1_000_000).base_cents).toBe(0);
  });

  it("ignora inativos e linhas zeradas", () => {
    const lines = buildPayroll(
      [
        employee,
        { ...employee, userId: "u2", employmentStatus: "inactive" },
        { ...employee, userId: "u3", paymentModel: "commission", additionalAmountCents: null },
      ],
      new Map([["u1", 200_000]]),
    );
    expect(lines.map((line) => line.user_id)).toEqual(["u1"]);
  });
});

describe("métricas", () => {
  const months = ["2026-10-01", "2026-11-01"];

  it("agrupa o caixa pelo mês do pagamento", () => {
    const flow = cashflow(months, {
      revenue: [{ date: "2026-10-15", amountCents: 500_000 }, { date: "2026-11-02", amountCents: 100_000 }, { date: null, amountCents: 999 }],
      payroll: [{ date: "2026-11-05", amountCents: 300_000 }],
      expenses: [{ date: "2026-11-10", amountCents: 50_000 }, { date: "2025-01-01", amountCents: 1 }],
    });
    expect(flow).toEqual([
      { month: "2026-10-01", revenueCents: 500_000, payrollCents: 0, expensesCents: 0, resultCents: 500_000 },
      { month: "2026-11-01", revenueCents: 100_000, payrollCents: 300_000, expensesCents: 50_000, resultCents: -250_000 },
    ]);
  });

  it("calcula o MRR pela vigência dos contratos", () => {
    const series = mrrSeries(
      months,
      [
        { status: "active", startDate: "2026-11-01", endDate: null, monthlyAmountCents: 300_000 },
        { status: "ended", startDate: "2026-01-01", endDate: "2026-10-31", monthlyAmountCents: 100_000 },
        { status: "cancelled", startDate: "2026-01-01", endDate: null, monthlyAmountCents: 999_999 },
      ],
      "2026-11-20",
    );
    expect(series.map((point) => point.mrrCents)).toEqual([100_000, 300_000]);
  });

  it("monta o funil cumulativo e a taxa de conversão", () => {
    const statuses = ["new", "contacted", "qualified", "won", "lost"] as const;
    expect(funnel([...statuses]).map((stage) => stage.count)).toEqual([4, 3, 2, 1, 1]);
    expect(conversionRate([...statuses])).toBe(50);
  });
});

describe("validações", () => {
  const item = { productId: "", description: "Tráfego", billingType: "recurring", quantity: 1, unitPrice: 3000, installments: 1 };

  it("exige cliente ou lead na proposta e bloqueia aceite direto", () => {
    expect(proposalSchema.safeParse({ title: "P", items: [item], status: "draft" }).success).toBe(false);
    expect(proposalSchema.safeParse({ title: "Pro", contactId: "8b0c6a4e-8a5f-4a43-9a3f-6f1c1f5f0a11", items: [item], status: "accepted" }).success).toBe(false);
    expect(proposalSchema.safeParse({ title: "Pro", contactId: "8b0c6a4e-8a5f-4a43-9a3f-6f1c1f5f0a11", items: [item], status: "sent" }).success).toBe(true);
  });

  it("rejeita contrato que termina antes de começar", () => {
    const result = contractSchema.safeParse({
      title: "Contrato",
      customerId: "8b0c6a4e-8a5f-4a43-9a3f-6f1c1f5f0a11",
      status: "active",
      startDate: "2026-11-01",
      endDate: "2026-10-01",
      dueDay: 10,
      items: [{ ...item, firstDueDate: "" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("patch da folha", () => {
  it("não zera bônus e descontos quando só o pagamento muda", async () => {
    const { payrollItemPatchSchema } = await import("@/lib/validations/finance");
    const parsed = payrollItemPatchSchema.parse({ paidAt: "2026-11-20" });
    expect(parsed.bonus).toBeUndefined();
    expect(parsed.deduction).toBeUndefined();
    expect(payrollItemPatchSchema.parse({ bonus: "", deduction: "12.5" })).toMatchObject({ bonus: null, deduction: 12.5 });
  });
});
