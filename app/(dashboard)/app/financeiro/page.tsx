import Link from "next/link";
import { FunnelChart, MrrChart } from "@/components/finance/charts";
import { PageHeader, Section, StatCard } from "@/components/finance/ui";
import { addMonths, formatDate, formatMonthShort, monthEnd, monthRange, monthStart, todayIso } from "@/lib/finance/dates";
import { listContracts, listLeads, listProposals, listReceivables } from "@/lib/finance/data";
import { leadStatusLabels } from "@/lib/finance/labels";
import { conversionRate, funnel, mrrSeries } from "@/lib/finance/metrics";
import { formatCents } from "@/lib/finance/money";
import { receivableDisplayStatus } from "@/lib/finance/receivables";

export default async function FinanceDashboardPage() {
  const today = todayIso();
  const month = monthStart(today);
  const [contracts, leads, proposals, monthReceivables, openReceivables] = await Promise.all([
    listContracts(),
    listLeads(),
    listProposals(),
    listReceivables({ from: month, to: month }),
    listReceivables({ status: ["open"] }),
  ]);

  const months = monthRange(today, 12);
  const mrr = mrrSeries(months, contracts, today);
  const currentMrr = mrr[mrr.length - 1].mrrCents;
  const previousMrr = mrr[mrr.length - 2].mrrCents;
  const received = monthReceivables.filter((receivable) => receivable.status === "paid").reduce((sum, receivable) => sum + (receivable.paidAmountCents ?? receivable.amountCents), 0);
  const expected = monthReceivables.filter((receivable) => receivable.status !== "cancelled").reduce((sum, receivable) => sum + receivable.amountCents, 0);
  const overdue = openReceivables.filter((receivable) => receivableDisplayStatus(receivable, today) === "overdue");
  const weekAhead = openReceivables.filter((receivable) => receivable.dueDate >= today && receivable.dueDate <= monthEnd(today)).slice(0, 8);
  const since = addMonths(today, -1);
  const newLeads = leads.filter((lead) => lead.createdAt.slice(0, 10) >= since);
  const statuses = leads.filter((lead) => lead.status !== "archived").map((lead) => lead.status);
  const openProposals = proposals.filter((proposal) => proposal.status === "draft" || proposal.status === "sent");
  const unassigned = leads.filter((lead) => !lead.assigneeId && (lead.status === "new" || lead.status === "contacted"));
  const delta = currentMrr - previousMrr;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Financeiro · Comercial" title="Dashboard comercial" description="Receita recorrente, cobrança do mês e o funil de vendas." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="MRR" value={formatCents(currentMrr)} hint={`${delta >= 0 ? "+" : "−"}${formatCents(Math.abs(delta))} vs. mês anterior`} href="/app/financeiro/contratos" />
        <StatCard title="Recebido no mês" value={formatCents(received)} hint={`de ${formatCents(expected)} previstos`} tone="positive" href="/app/financeiro/contratos" />
        <StatCard title="Em atraso" value={formatCents(overdue.reduce((sum, receivable) => sum + receivable.amountCents, 0))} hint={`${overdue.length} parcela(s)`} tone={overdue.length ? "negative" : undefined} href="/app/financeiro/contratos" />
        <StatCard title="Leads (30 dias)" value={String(newLeads.length)} hint={`Conversão ${conversionRate(statuses)}% · ${openProposals.length} proposta(s) aberta(s)`} href="/app/financeiro/leads" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Section title="MRR · 12 meses">
          <MrrChart data={mrr.map((point) => ({ label: formatMonthShort(point.month), mrrCents: point.mrrCents }))} />
        </Section>
        <Section title="Funil de leads">
          <FunnelChart data={funnel(statuses).map((stage) => ({ label: leadStatusLabels[stage.stage], count: stage.count }))} />
        </Section>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="A vencer este mês" actions={<Link href="/app/financeiro/contratos" className="text-sm text-muted-foreground hover:text-foreground">Ver parcelas</Link>}>
          {weekAhead.length ? (
            <ul className="grid gap-2 text-sm">
              {weekAhead.map((receivable) => (
                <li key={receivable.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                  <Link href={`/app/financeiro/contratos/${receivable.contractId}`} className="min-w-0 truncate hover:text-primary">{receivable.customerName ?? receivable.contractTitle}</Link>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{formatDate(receivable.dueDate)} · <span className="text-foreground">{formatCents(receivable.amountCents)}</span></span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nada a vencer até o fim do mês.</p>
          )}
        </Section>
        <Section title="Leads sem responsável" actions={<Link href="/app/financeiro/leads" className="text-sm text-muted-foreground hover:text-foreground">Abrir funil</Link>}>
          {unassigned.length ? (
            <ul className="grid gap-2 text-sm">
              {unassigned.slice(0, 8).map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                  <span className="min-w-0 truncate">{lead.name}{lead.company ? ` · ${lead.company}` : ""}</span>
                  <span className="shrink-0 text-muted-foreground">{formatDate(lead.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Todos os leads em aberto têm responsável.</p>
          )}
        </Section>
      </div>
    </div>
  );
}
