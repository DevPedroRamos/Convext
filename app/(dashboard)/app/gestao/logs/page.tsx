import { redirect } from "next/navigation";
import { PlatformLog } from "@/components/admin/platform-log";
import { PageHeader } from "@/components/finance/ui";
import { listPlatformEvents } from "@/lib/admin/logs";
import { canAccessArea } from "@/lib/access";
import { getViewer } from "@/lib/spaces/viewer";

export default async function PlatformLogsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (!canAccessArea(viewer.role, "gestao")) redirect("/app");
  const events = await listPlatformEvents();
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Área administrativa" title="Logs" description="Alterações de equipe, gestão da plataforma e financeiro administrativo." />
      <div className="grid gap-3">
        <p className="label">Histórico</p>
        <PlatformLog events={events} />
      </div>
    </div>
  );
}
