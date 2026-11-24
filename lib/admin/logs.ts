import type { SupabaseClient } from "@supabase/supabase-js";
import { profileName } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;
type ProfileJoin = { id: string; first_name: string | null; last_name: string | null; email?: string | null } | null;

export type PlatformEvent = {
  id: string;
  actorName: string | null;
  area: "equipe" | "gestao" | "financeiro";
  kind: "created" | "updated" | "deleted";
  entity: string;
  message: string;
  createdAt: string;
};

async function db(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

export async function listPlatformEvents(limit = 200): Promise<PlatformEvent[]> {
  const client = await db();
  const { data } = await client
    .from("platform_events")
    .select("id, actor_id, area, kind, entity, message, created_at, actor:profiles(id, first_name, last_name, email)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Row[]).map((row) => {
    const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor;
    return {
      id: row.id as string,
      actorName: actor ? profileName(actor as ProfileJoin, (actor as ProfileJoin)?.email) : null,
      area: row.area as PlatformEvent["area"],
      kind: row.kind as PlatformEvent["kind"],
      entity: row.entity as string,
      message: row.message as string,
      createdAt: row.created_at as string,
    };
  });
}
