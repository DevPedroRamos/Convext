import { callRpc } from "@/lib/communication/rpc";
import type { DirectoryPerson } from "@/types/communication";

export async function listPeople(client: { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }) {
  const data = await callRpc<DirectoryPerson[] | { id: string }[]>(client, "communication_list_people");
  if (!Array.isArray(data)) return [];
  return data.map((row) => {
    const person = row as DirectoryPerson & { last_seen_at?: string | null };
    return {
      id: person.id,
      firstName: person.firstName ?? null,
      lastName: person.lastName ?? null,
      avatarUrl: person.avatarUrl ?? null,
      available: Boolean(person.available),
      lastSeenAt: person.lastSeenAt ?? person.last_seen_at ?? null,
      inCall: Boolean(person.inCall),
    };
  });
}
