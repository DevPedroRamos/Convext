import { MonthPicker } from "@/components/finance/month-picker";
import { PayrollManager } from "@/components/finance/payroll-manager";
import { PageHeader, StatCard } from "@/components/finance/ui";
import { formatMonthLong, parseMonth, todayIso } from "@/lib/finance/dates";
import { getPayroll } from "@/lib/finance/data";
import { formatCents } from "@/lib/finance/money";

export default async function FinancePayrollPage({ searchParams }: { searchParams: Promise<{ mes?: string | string[] }> }) {
  const { mes } = await searchParams;
  const month = parseMonth(typeof mes === "string" ? mes : null, todayIso());
  const { run, items } = await getPayroll(month);
  const sum = (pick: (item: (typeof items)[number]) => number) => items.reduce((total, item) => total + pick(item), 0);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Financeiro · Administrativo" title={`Folha · ${formatMonthLong(month)}`} description="Pagamentos da equipe no mês, com comissão sobre o recebido." actions={<MonthPicker month={month} />} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total da folha" value={formatCents(sum((item) => item.totalCents))} hint={`${items.length} pessoa(s)`} />
        <StatCard title="Fixos" value={formatCents(sum((item) => item.baseCents + item.additionalCents))} hint="Fixo + adicionais" />
        <StatCard title="Comissões" value={formatCents(sum((item) => item.commissionCents))} />
        <StatCard title="Pendente de pagamento" value={formatCents(sum((item) => (item.paidAt ? 0 : item.totalCents)))} tone={items.some((item) => !item.paidAt) ? "warning" : undefined} />
      </div>
      <PayrollManager month={month} run={run} items={items} />
    </div>
  );
}
