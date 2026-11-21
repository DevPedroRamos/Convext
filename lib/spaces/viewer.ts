import { resolveAppRole } from "@/lib/access";
import { getCurrentUserProfile } from "@/lib/profile";
import type { Viewer } from "@/lib/spaces/rules";

export async function getViewer(): Promise<Viewer | null> {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) return null;
  return { id: user.id, role: resolveAppRole(profile?.role) };
}
