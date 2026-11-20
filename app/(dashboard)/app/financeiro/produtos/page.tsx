import { ProductsManager } from "@/components/finance/products-manager";
import { PageHeader } from "@/components/finance/ui";
import { listProducts } from "@/lib/finance/data";
import { getCurrentUserProfile, isAdmin } from "@/lib/profile";

export default async function FinanceProductsPage() {
  const [{ profile }, products] = await Promise.all([getCurrentUserProfile(), listProducts()]);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Financeiro · Comercial" title="Produtos" description="Catálogo de serviços mensais e avulsos usado nas propostas." />
      <ProductsManager products={products} canDelete={isAdmin(profile)} />
    </div>
  );
}
