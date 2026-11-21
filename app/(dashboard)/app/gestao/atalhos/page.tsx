import { PageHeader } from "@/components/finance/ui";
import { QuickActionsEditor } from "@/components/spaces/quick-actions-editor";
import { listForms, listQuickActions, listSpaces } from "@/lib/spaces/data";

export default async function QuickActionsConfigPage() {
  const [actions, forms, spaces] = await Promise.all([listQuickActions(), listForms(), listSpaces()]);
  const version = actions.map((action) => action.id).join(",");
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Gestão" title="Atalho rápido" description="Monte o menu do botão laranja por role: formulários dos espaços e ações do sistema." />
      <QuickActionsEditor key={version} actions={actions} forms={forms} spaces={spaces} />
    </div>
  );
}
