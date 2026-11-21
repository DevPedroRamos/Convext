import { LeadsBoard } from "@/components/finance/leads-board";
import { PageHeader } from "@/components/finance/ui";
import { listClientOptions, listFinancePeople, listLeads } from "@/lib/finance/data";
import { getCurrentUserProfile, isAdmin } from "@/lib/profile";

export default async function FinanceLeadsPage() {
  const [{ user, profile }, leads, people, clients] = await Promise.all([getCurrentUserProfile(), listLeads(), listFinancePeople(), listClientOptions()]);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Financeiro · Comercial" title="Leads" description="Contatos do site e cadastros manuais, do primeiro contato ao fechamento." />
      <LeadsBoard leads={leads} people={people} clients={clients} currentUserId={user?.id ?? ""} canDelete={isAdmin(profile)} />
    </div>
  );
}
