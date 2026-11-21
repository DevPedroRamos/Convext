import { PageHeader } from "@/components/finance/ui";
import { FormBuilder } from "@/components/spaces/form-builder";
import { listForms, listQuickActions, listSpaces } from "@/lib/spaces/data";

export default async function FormsConfigPage() {
  const [forms, spaces, quickActions] = await Promise.all([listForms(), listSpaces(), listQuickActions()]);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Gestão" title="Formulários" description="Cada formulário abre uma tarefa num espaço. Escolha os campos e quem pode enviar." />
      <FormBuilder forms={forms} spaces={spaces} quickActions={quickActions} />
    </div>
  );
}
