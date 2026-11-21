import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/finance/ui";
import { SpaceBoard } from "@/components/spaces/space-board";
import { listClients } from "@/lib/clients";
import { getSpace, listForms, listTasks } from "@/lib/spaces/data";
import { getViewer } from "@/lib/spaces/viewer";

export default async function SpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const [space, tasks, forms, clients] = await Promise.all([getSpace(id), listTasks({ spaceId: id }), listForms(), listClients()]);
  if (!space) notFound();
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Espaço" title={space.name} />
      <SpaceBoard space={space} tasks={tasks} forms={forms} clients={clients.map((client) => ({ id: client.id, name: client.name }))} viewer={viewer} />
    </div>
  );
}
