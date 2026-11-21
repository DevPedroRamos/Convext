import { ProposalsManager } from "@/components/finance/proposals-manager";
import { PageHeader, StatCard } from "@/components/finance/ui";
import { getFinanceSettings, listCustomers, listFinancePeople, listLeads, listProducts, listProposals } from "@/lib/finance/data";
import { formatCents, percent } from "@/lib/finance/money";
import { getCurrentUserProfile, isAdmin } from "@/lib/profile";

export default async function FinanceProposalsPage({ searchParams }: { searchParams: Promise<{ lead?: string | string[] }> }) {
  const { lead } = await searchParams;
  const [{ user, profile }, proposals, customers, leads, products, people, settings] = await Promise.all([
    getCurrentUserProfile(),
    listProposals(),
    listCustomers(),
    listLeads(),
    listProducts(),
    listFinancePeople(),
    getFinanceSettings(),
  ]);
  const open = proposals.filter((proposal) => proposal.status === "draft" || proposal.status === "sent");
  const decided = proposals.filter((proposal) => proposal.status === "accepted" || proposal.status === "rejected");
  const accepted = decided.filter((proposal) => proposal.status === "accepted");

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Financeiro · Comercial" title="Propostas" description="Monte a proposta, envie e, quando aceita, gere o contrato em um clique." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Em aberto" value={String(open.length)} hint="Rascunhos e enviadas" />
        <StatCard title="Mensal em negociação" value={formatCents(open.reduce((sum, proposal) => sum + proposal.recurringCents, 0))} hint={`+ ${formatCents(open.reduce((sum, proposal) => sum + proposal.oneOffCents, 0))} avulso`} />
        <StatCard title="Taxa de aceite" value={`${percent(accepted.length, decided.length)}%`} hint={`${accepted.length} de ${decided.length} decididas`} />
      </div>
      <ProposalsManager
        proposals={proposals}
        customers={customers}
        leads={leads}
        products={products}
        people={people}
        currentUserId={user?.id ?? ""}
        defaultDueDay={settings.defaultDueDay}
        canDelete={isAdmin(profile)}
        initialLeadId={typeof lead === "string" ? lead : null}
      />
    </div>
  );
}
