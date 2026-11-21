import Link from "next/link";
import { notFound } from "next/navigation";
import { ContractActions } from "@/components/finance/contract-actions";
import { ContractDialog } from "@/components/finance/contract-dialog";
import { contractTone } from "@/components/finance/tones";
import { GenerateReceivablesButton, ReceivablesTable } from "@/components/finance/receivables-table";
import { PageHeader, Section, StatCard, StatusBadge } from "@/components/finance/ui";
import { formatDate, todayIso } from "@/lib/finance/dates";
import { getContract, getFinanceSettings, listCustomers, listFinancePeople, listProducts, listReceivables } from "@/lib/finance/data";
import { billingTypeLabels, contractStatusLabels } from "@/lib/finance/labels";
import { formatCents } from "@/lib/finance/money";
import { receivableDisplayStatus } from "@/lib/finance/receivables";
import { getCurrentUserProfile, isAdmin } from "@/lib/profile";

export default async function FinanceContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [contract, { profile }, customers, products, people, settings, receivables] = await Promise.all([
    getContract(id),
    getCurrentUserProfile(),
    listCustomers(),
    listProducts(),
    listFinancePeople(),
    getFinanceSettings(),
    listReceivables({ contractId: id }),
  ]);
  if (!contract) notFound();
  const today = todayIso();
  const paid = receivables.filter((receivable) => receivable.status === "paid").reduce((sum, receivable) => sum + (receivable.paidAmountCents ?? receivable.amountCents), 0);
  const open = receivables.filter((receivable) => receivable.status === "open");
  const overdue = open.filter((receivable) => receivableDisplayStatus(receivable, today) === "overdue");
  const oneOffTotal = contract.items.filter((item) => item.billingType === "one_off").reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/app/financeiro/contratos" className="text-sm text-muted-foreground hover:text-foreground">← Contratos</Link>
      </div>
      <PageHeader
        eyebrow={`Contrato · ${contract.customerName}`}
        title={contract.title}
        description={`Desde ${formatDate(contract.startDate)}${contract.endDate ? ` até ${formatDate(contract.endDate)}` : ""} · vencimento dia ${contract.dueDay}${contract.sellerName ? ` · vendedor ${contract.sellerName}` : ""}`}
        actions={
          <>
            <StatusBadge label={contractStatusLabels[contract.status]} tone={contractTone[contract.status]} />
            <ContractDialog contract={contract} customers={customers} products={products} people={people} defaultDueDay={settings.defaultDueDay} />
            <ContractActions contract={contract} canDelete={isAdmin(profile)} />
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Mensalidade" value={formatCents(contract.monthlyAmountCents)} />
        <StatCard title="Avulsos" value={formatCents(oneOffTotal)} hint="Total dos itens pontuais" />
        <StatCard title="Recebido" value={formatCents(paid)} tone="positive" />
        <StatCard title="Em aberto" value={formatCents(open.reduce((sum, receivable) => sum + receivable.amountCents, 0))} hint={overdue.length ? `${overdue.length} em atraso` : "Nada em atraso"} tone={overdue.length ? "negative" : undefined} />
      </div>
      <Section title="Itens">
        <div className="grid gap-2">
          {contract.items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-xs text-muted-foreground">
                  {billingTypeLabels[item.billingType]} · {item.quantity} × {formatCents(item.unitPriceCents)}
                  {item.billingType === "one_off" ? ` · ${item.installments}x a partir de ${formatDate(item.firstDueDate)}` : ""}
                </p>
              </div>
              <p className="tabular-nums">{formatCents(item.quantity * item.unitPriceCents)}{item.billingType === "recurring" ? " /mês" : ""}</p>
            </div>
          ))}
        </div>
        {contract.notes ? <p className="text-sm whitespace-pre-line text-muted-foreground">{contract.notes}</p> : null}
      </Section>
      <Section title="Parcelas" actions={contract.status !== "cancelled" ? <GenerateReceivablesButton month={today} contractId={contract.id} label="Gerar parcela do mês atual" /> : null}>
        <ReceivablesTable receivables={receivables} showContract={false} empty="Nenhuma parcela gerada ainda." />
      </Section>
    </div>
  );
}
