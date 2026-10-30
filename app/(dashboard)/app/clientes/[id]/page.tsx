import { notFound } from "next/navigation";
import { ClientDeleteButton } from "@/components/dashboard/client-delete-button";
import { ClientForm } from "@/components/forms/client-form";
import { getClientById } from "@/lib/clients";
import { getCurrentUserProfile, isAdmin, listTeamProfiles } from "@/lib/profile";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile } = await getCurrentUserProfile();
  if (!user) return null;
  const [record, team] = await Promise.all([getClientById(id), listTeamProfiles()]);
  if (!record) notFound();
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-primary">Clientes</p>
          <h2 className="mt-2 font-display text-h2">Editar {record.name}.</h2>
        </div>
        {isAdmin(profile) ? <ClientDeleteButton id={record.id} name={record.name} /> : null}
      </div>
      <ClientForm team={team} record={record} />
    </div>
  );
}
