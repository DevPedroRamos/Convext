import { ExpensesManager } from "@/components/finance/expenses-manager";
import { MonthPicker } from "@/components/finance/month-picker";
import { PageHeader, Section, StatCard } from "@/components/finance/ui";
import { formatMonthLong, formatMonthShort, monthEnd, monthRange, parseMonth, todayIso } from "@/lib/finance/dates";
import { listExpenseCategories, listExpenses, listPaidExpenses, listPaidPayroll, listPaidReceivables } from "@/lib/finance/data";
import { cashflow } from "@/lib/finance/metrics";
import { formatCents } from "@/lib/finance/money";
import { cn } from "@/lib/utils";

export default async function FinanceBalancePage({ searchParams }: { searchParams: Promise<{ mes?: string | string[] }> }) {
  const { mes } = await searchParams;
  const month = parseMonth(typeof mes === "string" ? mes : null, todayIso());
  const months = monthRange(month, 12);
  const from = months[0];
  const to = monthEnd(month);
  const [revenue, payroll, paidExpenses, expenses, categories] = await Promise.all([
    listPaidReceivables(from, to),
    listPaidPayroll(from, to),
    listPaidExpenses(from, to),
    listExpenses(month, month),
    listExpenseCategories(),
  ]);
  const flow = cashflow(months, {
    revenue: revenue.map((entry) => ({ date: entry.paidAt, amountCents: entry.amountCents })),
    payroll,
    expenses: paidExpenses,
  });
  const current = flow[flow.length - 1];
  const yearResult = flow.reduce((sum, entry) => sum + entry.resultCents, 0);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Financeiro · Administrativo" title={`Balanço · ${formatMonthLong(month)}`} description="Regime de caixa: entra o que foi recebido e sai o que foi pago, pela data do pagamento." actions={<MonthPicker month={month} />} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Receitas" value={formatCents(current.revenueCents)} tone="positive" />
        <StatCard title="Folha" value={formatCents(current.payrollCents)} />
        <StatCard title="Despesas" value={formatCents(current.expensesCents)} />
        <StatCard title="Resultado do mês" value={formatCents(current.resultCents)} tone={current.resultCents >= 0 ? "positive" : "negative"} hint={`12 meses: ${formatCents(yearResult)}`} />
      </div>
      <Section title="Fluxo de caixa · 12 meses">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 font-normal">Mês</th>
                <th className="py-2 text-right font-normal">Receitas</th>
                <th className="py-2 text-right font-normal">Folha</th>
                <th className="py-2 text-right font-normal">Despesas</th>
                <th className="py-2 text-right font-normal">Resultado</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[...flow].reverse().map((entry) => (
                <tr key={entry.month} className={cn("border-b border-border/60", entry.month === month && "bg-muted/40")}>
                  <td className="py-2">{formatMonthShort(entry.month)}</td>
                  <td className="py-2 text-right">{formatCents(entry.revenueCents)}</td>
                  <td className="py-2 text-right">{formatCents(entry.payrollCents)}</td>
                  <td className="py-2 text-right">{formatCents(entry.expensesCents)}</td>
                  <td className={cn("py-2 text-right font-medium", entry.resultCents < 0 ? "text-destructive" : "text-emerald-400")}>{formatCents(entry.resultCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title={`Despesas · ${formatMonthLong(month)}`}>
        <ExpensesManager month={month} expenses={expenses} categories={categories} />
      </Section>
    </div>
  );
}
