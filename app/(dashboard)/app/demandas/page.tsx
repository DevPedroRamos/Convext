import { DemandasBoard } from "@/components/dashboard/demandas-board";
import { listClients } from "@/lib/clients";
import { listDemands } from "@/lib/demands";
import { getCurrentUserProfile, isAdmin, isOperations, listCreators } from "@/lib/profile";

export default async function DemandasPage() {
  const [{ user, profile }, demands, clients, creators] = await Promise.all([
    getCurrentUserProfile(),
    listDemands(),
    listClients(),
    listCreators(),
  ]);
  const ops = isOperations(profile);

  return (
    <DemandasBoard
      demands={demands}
      clients={clients}
      creators={creators}
      currentUserId={user?.id}
      canFilterResponsible={ops}
      canCreate={ops}
      isAdmin={isAdmin(profile)}
      isOperations={ops}
    />
  );
}
