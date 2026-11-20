import { ExpenseCategoriesManager, FinanceSettingsForm } from "@/components/finance/finance-settings";
import { PageHeader } from "@/components/finance/ui";
import { getFinanceSettings, listExpenseCategories } from "@/lib/finance/data";

export default async function FinanceManagementPage() {
  const [settings, categories] = await Promise.all([getFinanceSettings(), listExpenseCategories()]);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Financeiro · Administrativo" title="Gestão financeira" description="Padrões de cobrança e categorias do balanço. A remuneração de cada pessoa fica em Equipe." />
      <div className="grid gap-6 xl:grid-cols-2">
        <FinanceSettingsForm settings={settings} />
        <ExpenseCategoriesManager categories={categories} />
      </div>
    </div>
  );
}
