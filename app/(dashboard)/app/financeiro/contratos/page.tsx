import { ContractDialog } from "@/components/finance/contract-dialog";
import { ContractsTable } from "@/components/finance/contracts-table";
import { MonthPicker } from "@/components/finance/month-picker";
import { GenerateReceivablesButton, ReceivablesTable } from "@/components/finance/receivables-table";
import { PageHeader, Section, StatCard } from "@/components/finance/ui";
import { formatMonthLong, parseMonth, todayIso } from "@/lib/finance/dates";
import { getFinanceSettings, listContracts, listCustomers, listFinancePeople, listProducts, listReceivables } from "@/lib/finance/data";
import { formatCents } from "@/lib/finance/money";
import { receivableDisplayStatus } from "@/lib/finance/receivables";

export default async function FinanceContractsPage({ searchParams }: { searchParams: Promise<{ mes?: string | string[] }> }) {
  const { mes } = await searchParams;
  const today = todayIso();
  const month = parseMonth(typeof mes === "string" ? mes : null, today);
  const [contracts, customers, products, people, settings, monthReceivables, openReceivables] = await Promise.all([
    listContracts(),
    listCustomers(),
    listProducts(),
    listFinancePeople(),
    getFinanceSettings(),
    listReceivables({ from: month, to: month }),
    listReceivables({ status: ["open"] }),
  ]);
  const active = contracts.filter((contract) => contract.status === "active");
  const overdue = openReceivables.filter((receivable) => receivableDisplayStatus(receivable, today) === "overdue");
  const monthOpen = monthReceivables.filter((receivable) => receivable.status === "open");
  const monthPaid = monthReceivables.filter((receivable) => receivable.status === "paid");

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Financeiro · Comercial"
        title="Contratos"
        description="Mensalidades e itens avulsos, com as parcelas a receber de cada mês."
        actions={<ContractDialog customers={customers} products={products} people={people} defaultDueDay={settings.defaultDueDay} />}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Contratos ativos" value={String(active.length)} />
        <StatCard title="MRR" value={formatCents(active.reduce((sum, contract) => sum + contract.monthlyAmountCents, 0))} hint="Soma das mensalidades ativas" />
        <StatCard title={`A receber · ${formatMonthLong(month)}`} value={formatCents(monthOpen.reduce((sum, receivable) => sum + receivable.amountCents, 0))} hint={`${formatCents(monthPaid.reduce((sum, receivable) => sum + (receivable.paidAmountCents ?? receivable.amountCents), 0))} já recebido`} />
        <StatCard title="Em atraso" value={formatCents(overdue.reduce((sum, receivable) => sum + receivable.amountCents, 0))} hint={`${overdue.length} parcela(s)`} tone={overdue.length ? "negative" : undefined} />
      </div>
      <ContractsTable contracts={contracts} />
      <Section
        title={`Parcelas · ${formatMonthLong(month)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MonthPicker month={month} />
            <GenerateReceivablesButton month={month} />
          </div>
        }
      >
        <ReceivablesTable receivables={monthReceivables} empty="Nenhuma parcela neste mês. Use “Gerar parcelas do mês”." />
      </Section>
      {overdue.length ? (
        <Section title="Em atraso (todos os meses)">
          <ReceivablesTable receivables={overdue} />
        </Section>
      ) : null}
    </div>
  );
}
