import { PageHeader } from "@/components/finance/ui";
import { FlowEditor } from "@/components/spaces/flow-editor";
import { listSpaces } from "@/lib/spaces/data";

export default async function SpacesConfigPage({ searchParams }: { searchParams: Promise<{ espaco?: string | string[] }> }) {
  const { espaco } = await searchParams;
  const spaces = await listSpaces();
  const initialId = typeof espaco === "string" ? espaco : null;
  // Remonta o editor quando o servidor devolve o fluxo salvo (ids das etapas novas).
  const version = spaces.map((space) => `${space.id}:${space.stages.map((stage) => stage.id).join(",")}`).join("|");
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Gestão" title="Espaços e fluxos" description="Cada espaço é um time com seu quadro. As etapas viram colunas e definem quem age em cada momento." />
      <FlowEditor key={`${initialId}|${version}`} spaces={spaces} initialId={initialId} />
    </div>
  );
}
