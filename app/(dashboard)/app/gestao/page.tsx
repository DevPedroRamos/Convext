import { FeedbackTypeManager } from "@/components/dashboard/feedback-type-form";
import { TeamStatusManager } from "@/components/dashboard/team-status-form";
import { listFeedbackTypes } from "@/lib/feedback-types";
import { listTeamStatuses } from "@/lib/team-status";

export default async function GestaoPage() {
  const [types, statuses] = await Promise.all([listFeedbackTypes(), listTeamStatuses()]);

  return (
    <div className="grid gap-10">
      <div>
        <p className="label text-primary">Gestão da plataforma</p>
        <h2 className="mt-2 font-display text-h2">Catálogos do admin.</h2>
      </div>

      <section className="grid gap-4">
        <h3 className="text-sm font-medium">Tipos de feedback</h3>
        <FeedbackTypeManager types={types} />
      </section>

      <section className="grid gap-4">
        <h3 className="text-sm font-medium">Status de presença</h3>
        <TeamStatusManager statuses={statuses} />
      </section>
    </div>
  );
}
