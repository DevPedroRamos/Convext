import { NextResponse } from "next/server";
import { canAccessArea, type AppArea } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { user, profile };
}

export function profileName(profile: { first_name: string | null; last_name: string | null } | null, email?: string | null) {
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  return name || email?.split("@")[0] || "Convext";
}

export function isOnboardingComplete(profile: { onboarding_completed?: boolean | null } | null) {
  return Boolean(profile?.onboarding_completed);
}

export function isAdmin(profile: { role?: string | null } | null) {
  return profile?.role === "admin";
}

export function isCoordinator(profile: { role?: string | null } | null) {
  return profile?.role === "coordinator";
}

export function isOperations(profile: { role?: string | null } | null) {
  return isAdmin(profile) || isCoordinator(profile);
}

export type TeamProfile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  cargo: string | null;
  email: string | null;
  avatarUrl: string | null;
  available: boolean;
  statusId: string | null;
  statusName: string | null;
  statusIcon: string | null;
};

export type CreatorOption = {
  id: string;
  name: string;
};

type TeamProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  cargo: string | null;
  email: string | null;
  avatar_url: string | null;
  available: boolean | null;
  status_id: string | null;
  status: { name: string; icon: string } | { name: string; icon: string }[] | null;
};

function mapTeamProfile(row: TeamProfileRow): TeamProfile {
  const status = Array.isArray(row.status) ? row.status[0] : row.status;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    cargo: row.cargo,
    email: row.email,
    avatarUrl: row.avatar_url,
    available: Boolean(row.available),
    statusId: row.status_id,
    statusName: status?.name ?? null,
    statusIcon: status?.icon ?? null,
  };
}

export async function listCreators(): Promise<CreatorOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("role", "creator")
    .order("first_name", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    name: profileName({ first_name: row.first_name, last_name: row.last_name }, row.email),
  }));
}

export async function listTeamProfiles(): Promise<TeamProfile[]> {
  const supabase = await createClient();
  const query = await supabase
    .from("profiles")
    .select("id, first_name, last_name, cargo, email, avatar_url, available, status_id, status:team_statuses(name, icon)")
    .order("first_name", { ascending: true });
  if (!query.error && query.data) return query.data.map((row) => mapTeamProfile(row as TeamProfileRow));

  const fallback = await supabase
    .from("profiles")
    .select("id, first_name, last_name, cargo, email, avatar_url")
    .order("first_name", { ascending: true });
  if (fallback.error || !fallback.data) return [];
  return fallback.data.map((row) => mapTeamProfile({ ...row, available: false, status_id: null, status: null }));
}

export async function requireOnboardedUser() {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) {
    return {
      user: null,
      profile: null,
      response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }),
    };
  }
  if (!isOnboardingComplete(profile)) {
    return {
      user,
      profile,
      response: NextResponse.json({ error: "Complete o primeiro acesso." }, { status: 403 }),
    };
  }
  return { user, profile, response: null };
}

export async function requireAreaAccess(area: AppArea) {
  const result = await requireOnboardedUser();
  if (result.response) return result;
  if (!canAccessArea(result.profile?.role, area)) {
    return {
      ...result,
      response: NextResponse.json({ error: "Sem permissão para esta área." }, { status: 403 }),
    };
  }
  return result;
}
