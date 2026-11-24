import { PageHeader } from "@/components/finance/ui";
import { FeedbackTypeManager } from "@/components/dashboard/feedback-type-manager";
import { listFeedbackTypes } from "@/lib/feedback-types";

export default async function FeedbackTypesPage() {
  const types = await listFeedbackTypes();
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Gestão" title="Tipos de feedback" description="Catálogo global: o nome entra no formulário e a solução aparece para o time tratar o caso." />
      <FeedbackTypeManager types={types} />
    </div>
  );
}
