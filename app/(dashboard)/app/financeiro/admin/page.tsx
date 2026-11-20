import Link from "next/link";
import { CashflowChart } from "@/components/finance/charts";
import { payrollTone } from "@/components/finance/tones";
import { PageHeader, Section, StatCard, StatusBadge } from "@/components/finance/ui";
import { formatMonthLong, formatMonthShort, monthEnd, monthRange, monthStart, todayIso } from "@/lib/finance/dates";
import { getPayroll, listContracts, listPaidExpenses, listPaidPayroll, listPaidReceivables, listReceivables } from "@/lib/finance/data";
import { payrollStatusLabels } from "@/lib/finance/labels";
import { cashflow, mrrSeries } from "@/lib/finance/metrics";
import { formatCents, percent } from "@/lib/finance/money";
import { receivableDisplayStatus } from "@/lib/finance/receivables";

export default async function FinanceAdminDashboardPage() {
  const today = todayIso();
  const month = monthStart(today);
  const months = monthRange(today, 12);
  const from = months[0];
  const to = monthEnd(today);
  const [revenue, payroll, expenses, openReceivables, contracts, currentPayroll] = await Promise.all([
    listPaidReceivables(from, to),
    listPaidPayroll(from, to),
    listPaidExpenses(from, to),
    listReceivables({ status: ["open"] }),
    listContracts(),
    getPayroll(month),
  ]);

  const flow = cashflow(months, { revenue: revenue.map((entry) => ({ date: entry.paidAt, amountCents: entry.amountCents })), payroll, expenses });
  const current = flow[flow.length - 1];
  const totals = flow.reduce((sum, entry) => ({ revenue: sum.revenue + entry.revenueCents, result: sum.result + entry.resultCents }), { revenue: 0, result: 0 });
  const overdue = openReceivables.filter((receivable) => receivableDisplayStatus(receivable, today) === "overdue");
  const overdueTotal = overdue.reduce((sum, receivable) => sum + receivable.amountCents, 0);
  const mrr = mrrSeries([month], contracts, today)[0].mrrCents;

  const byCustomer = new Map<string, { name: string; cents: number }>();
  for (const entry of revenue) {
    if (!entry.customerId) continue;
    const current = byCustomer.get(entry.customerId) ?? { name: entry.customerName ?? "—", cents: 0 };
    current.cents += entry.amountCents;
    byCustomer.set(entry.customerId, current);
  }
  const topCustomers = [...byCustomer.values()].sort((a, b) => b.cents - a.cents).slice(0, 8);
  const payrollTotal = currentPayroll.items.reduce((sum, item) => sum + item.totalCents, 0);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Financeiro · Administrativo" title="Dashboard gerencial" description={`Visão de caixa da operação · ${formatMonthLong(month)}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Resultado do mês" value={formatCents(current.resultCents)} tone={current.resultCents >= 0 ? "positive" : "negative"} hint={`Receitas ${formatCents(current.revenueCents)}`} href="/app/financeiro/admin/balanco" />
        <StatCard title="Resultado · 12 meses" value={formatCents(totals.result)} tone={totals.result >= 0 ? "positive" : "negative"} hint={`Margem ${percent(totals.result, totals.revenue)}%`} href="/app/financeiro/admin/balanco" />
        <StatCard title="MRR" value={formatCents(mrr)} hint={`${contracts.filter((contract) => contract.status === "active").length} contrato(s) ativo(s)`} href="/app/financeiro/contratos" />
        <StatCard title="Inadimplência" value={formatCents(overdueTotal)} tone={overdueTotal ? "negative" : undefined} hint={`${overdue.length} parcela(s) vencida(s)`} href="/app/financeiro/contratos" />
      </div>
      <Section title="Receitas × saídas · 12 meses" actions={<Link href="/app/financeiro/admin/balanco" className="text-sm text-muted-foreground hover:text-foreground">Ver balanço</Link>}>
        <CashflowChart data={flow.map((entry) => ({ ...entry, label: formatMonthShort(entry.month) }))} />
      </Section>
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Maiores clientes · 12 meses">
          {topCustomers.length ? (
            <ol className="grid gap-2 text-sm">
              {topCustomers.map((customer, index) => (
                <li key={customer.name + index} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                  <span className="min-w-0 truncate"><span className="mr-2 text-muted-foreground tabular-nums">{index + 1}.</span>{customer.name}</span>
                  <span className="shrink-0 tabular-nums">{formatCents(customer.cents)} <span className="text-muted-foreground">· {percent(customer.cents, totals.revenue)}%</span></span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum recebimento registrado no período.</p>
          )}
        </Section>
        <Section title={`Folha · ${formatMonthLong(month)}`} actions={<Link href="/app/financeiro/admin/folha" className="text-sm text-muted-foreground hover:text-foreground">Abrir folha</Link>}>
          {currentPayroll.run ? (
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <StatusBadge label={payrollStatusLabels[currentPayroll.run.status]} tone={payrollTone[currentPayroll.run.status]} />
                <span className="text-muted-foreground">{currentPayroll.items.length} pessoa(s)</span>
              </div>
              <p className="font-display text-2xl tabular-nums">{formatCents(payrollTotal)}</p>
              <p className="text-muted-foreground">
                Pago {formatCents(currentPayroll.items.filter((item) => item.paidAt).reduce((sum, item) => sum + item.totalCents, 0))} ·{" "}
                {percent(payrollTotal, current.revenueCents || mrr)}% da receita do mês
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">A folha deste mês ainda não foi gerada.</p>
          )}
        </Section>
      </div>
    </div>
  );
}
