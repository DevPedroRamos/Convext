import { TeamBoard } from "@/components/dashboard/team-board";
import { listManagedEmployees } from "@/lib/employees";

export default async function EquipePage() {
  const employees = await listManagedEmployees();
  return <TeamBoard employees={employees} />;
}
