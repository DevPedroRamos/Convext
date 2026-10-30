import { DemandasBoard } from "@/components/dashboard/demandas-board";
import { listDemands } from "@/lib/demands";
import { getCurrentUserProfile, isOperations } from "@/lib/profile";

export default async function DemandasPage() {
  const [{ profile }, demands] = await Promise.all([getCurrentUserProfile(), listDemands()]);
  return <DemandasBoard demands={demands} canFilterResponsible={isOperations(profile)} />;
}
