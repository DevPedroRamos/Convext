import { PageHeader } from "@/components/finance/ui";
import { FormBuilder } from "@/components/spaces/form-builder";
import { listFeedbackTypes } from "@/lib/feedback-types";
import { listForms, listQuickActions, listSpaces } from "@/lib/spaces/data";

export default async function FormsConfigPage() {
  const [forms, spaces, quickActions, feedbackTypes] = await Promise.all([listForms(), listSpaces(), listQuickActions(), listFeedbackTypes()]);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Gestão" title="Formulários" description="Cada formulário abre uma tarefa num espaço. Escolha os campos e quem pode enviar." />
      <FormBuilder forms={forms} spaces={spaces} quickActions={quickActions} feedbackTypes={feedbackTypes} />
    </div>
  );
}
