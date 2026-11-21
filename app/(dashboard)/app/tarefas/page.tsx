import { redirect } from "next/navigation";
import { PageHeader } from "@/components/finance/ui";
import { MyTasks } from "@/components/spaces/my-tasks";
import { listForms, listSpaces, listTasks } from "@/lib/spaces/data";
import { getViewer } from "@/lib/spaces/viewer";

export default async function MyTasksPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const [tasks, spaces, forms] = await Promise.all([listTasks(), listSpaces(), listForms()]);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Espaços" title="Minhas tarefas" description="O que espera por você e o andamento do que você pediu." />
      <MyTasks tasks={tasks} spaces={spaces} forms={forms} viewer={viewer} />
    </div>
  );
}
