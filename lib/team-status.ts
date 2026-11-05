import { createClient } from "@/lib/supabase/server";
import { isTeamStatusIcon, type TeamStatus } from "@/lib/team-status-icons";

export type { TeamStatus, TeamStatusIconName } from "@/lib/team-status-icons";
export { teamStatusIcon, teamStatusIconNames } from "@/lib/team-status-icons";

function mapStatus(row: { id: string; name: string; icon: string; sort_order: number }): TeamStatus {
  return {
    id: row.id,
    name: row.name,
    icon: isTeamStatusIcon(row.icon) ? row.icon : "Focus",
    sortOrder: row.sort_order,
  };
}

export async function listTeamStatuses(): Promise<TeamStatus[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("team_statuses").select("id, name, icon, sort_order").order("sort_order").order("name");
  if (error || !data) return [];
  return data.map(mapStatus);
}

export async function createTeamStatus(values: { name: string; icon: string }) {
  const supabase = await createClient();
  const { count } = await supabase.from("team_statuses").select("id", { count: "exact", head: true });
  const { data, error } = await supabase
    .from("team_statuses")
    .insert({ name: values.name.trim(), icon: isTeamStatusIcon(values.icon) ? values.icon : "Focus", sort_order: count ?? 0 })
    .select("id, name, icon, sort_order")
    .single();
  if (error || !data) return { status: null, error: error?.message || "Não foi possível criar o status." };
  return { status: mapStatus(data), error: null };
}

export async function updateTeamStatus(id: string, values: { name: string; icon: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_statuses")
    .update({ name: values.name.trim(), icon: isTeamStatusIcon(values.icon) ? values.icon : "Focus" })
    .eq("id", id)
    .select("id, name, icon, sort_order")
    .single();
  if (error || !data) return { status: null, error: error?.message || "Não foi possível salvar o status." };
  return { status: mapStatus(data), error: null };
}

export async function deleteTeamStatus(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("team_statuses").delete().eq("id", id);
  return error?.message ?? null;
}

export async function updateOwnPresence(available: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };
  const { error } = await supabase.from("profiles").update({ available }).eq("id", user.id);
  return { error: error?.message ?? null };
}

export async function updateOwnStatus(statusId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };
  const { error } = await supabase.from("profiles").update({ status_id: statusId }).eq("id", user.id);
  return { error: error?.message ?? null };
}
