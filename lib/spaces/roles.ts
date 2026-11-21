import type { AppRole } from "@/lib/access";

export const SPACE_ROLES: AppRole[] = ["admin", "coordinator", "traffic", "creator", "commercial"];

export const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  coordinator: "Coordenador",
  traffic: "Tráfego",
  creator: "Creator",
  commercial: "Comercial",
};

/** Dono de etapa: uma role ou "quem solicitou". */
export type StageOwner = AppRole | "requester";

export function ownerLabel(owner: StageOwner | null | undefined) {
  if (!owner) return "—";
  if (owner === "requester") return "Quem solicitou";
  return roleLabels[owner] ?? owner;
}
