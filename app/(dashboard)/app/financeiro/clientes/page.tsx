import { CustomersManager, type CustomerRow } from "@/components/finance/customers-manager";
import { PageHeader } from "@/components/finance/ui";
import { listClientOptions, listContracts, listCustomers, listFinancePeople } from "@/lib/finance/data";
import { getCurrentUserProfile, isAdmin } from "@/lib/profile";

export default async function FinanceCustomersPage() {
  const [{ profile }, customers, contracts, people, clients] = await Promise.all([
    getCurrentUserProfile(),
    listCustomers(),
    listContracts(),
    listFinancePeople(),
    listClientOptions(),
  ]);
  const rows: CustomerRow[] = customers.map((customer) => {
    const active = contracts.filter((contract) => contract.customerId === customer.id && contract.status === "active");
    return { ...customer, activeContracts: active.length, mrrCents: active.reduce((sum, contract) => sum + contract.monthlyAmountCents, 0) };
  });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Financeiro · Comercial" title="Clientes financeiros" description="Quem paga: dados de cobrança, contratos ativos e mensalidade." />
      <CustomersManager customers={rows} people={people} clients={clients} canDelete={isAdmin(profile)} />
    </div>
  );
}
