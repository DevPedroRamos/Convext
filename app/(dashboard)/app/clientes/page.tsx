import { ClientsTable } from "@/components/dashboard/clients-table";
import { NewClientDialog } from "@/components/dashboard/new-client-dialog";
import { listClients } from "@/lib/clients";
import { getCurrentUserProfile, isAdmin, listTeamProfiles } from "@/lib/profile";

export default async function ClientsPage() {
  const [{ profile }, clients, team] = await Promise.all([
    getCurrentUserProfile(),
    listClients(),
    listTeamProfiles(),
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-primary">Clientes</p>
          <h2 className="mt-2 font-display text-h2">Contas Convext.</h2>
        </div>
        <NewClientDialog team={team} />
      </div>
      {clients.length === 0 ? (
        <div className="surface p-8 text-muted-foreground">Nenhum cliente cadastrado.</div>
      ) : (
        <ClientsTable clients={clients} canDelete={isAdmin(profile)} />
      )}
    </div>
  );
}
