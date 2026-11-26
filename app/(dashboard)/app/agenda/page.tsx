import { redirect } from "next/navigation";
import { AgendaView } from "@/components/agenda/agenda-view";
import { PageHeader } from "@/components/finance/ui";
import { listAppointments, listAttendeeOptions } from "@/lib/agenda/data";
import { listClients } from "@/lib/clients";
import { listFeedbackTypes } from "@/lib/feedback-types";
import { canAccessArea } from "@/lib/access";
import { listForms, listSpaces, listTasksByIds } from "@/lib/spaces/data";
import { getViewer } from "@/lib/spaces/viewer";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function defaultRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  from.setDate(from.getDate() - 7);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  to.setDate(to.getDate() + 7);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ de?: string | string[]; ate?: string | string[] }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (!canAccessArea(viewer.role, "agenda")) redirect("/app");
  const params = await searchParams;
  const fallback = defaultRange();
  const from = one(params.de) || fallback.from;
  const to = one(params.ate) || fallback.to;
  const [appointments, attendees, spaces, forms, clients, feedbackTypes] = await Promise.all([
    listAppointments({ from, to }),
    listAttendeeOptions(),
    listSpaces(),
    listForms(),
    listClients(),
    listFeedbackTypes(),
  ]);
  const tasks = await listTasksByIds([...new Set(appointments.map((item) => item.taskId))]);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Agenda" title="Compromissos" description="O que está marcado a partir das demandas dos Espaços." />
      <AgendaView
        appointments={appointments}
        tasks={tasks}
        spaces={spaces}
        forms={forms}
        clients={clients.map((client) => ({ id: client.id, name: client.name }))}
        attendees={attendees}
        feedbackTypes={feedbackTypes}
        viewer={viewer}
      />
    </div>
  );
}
