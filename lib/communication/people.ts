import { callRpc } from "@/lib/communication/rpc";
import type { DirectoryPerson } from "@/types/communication";

export async function listPeople(client: { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }) {
  const data = await callRpc<DirectoryPerson[] | { id: string }[]>(client, "communication_list_people");
  return Array.isArray(data) ? data : [];
}
