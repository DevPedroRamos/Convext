export type AppRole = "admin" | "coordinator" | "traffic" | "creator";
export type AppArea = "dashboard" | "demandas" | "clientes" | "feedback" | "cases" | "perfil" | "equipe" | "gestao";

const operations: AppRole[] = ["admin", "coordinator"];

const areasByRole: Record<AppRole, readonly AppArea[]> = {
  admin: ["dashboard", "demandas", "clientes", "feedback", "cases", "perfil", "equipe", "gestao"],
  coordinator: ["dashboard", "demandas", "clientes", "feedback", "cases", "perfil"],
  traffic: ["dashboard", "demandas", "perfil"],
  creator: ["dashboard", "demandas", "perfil"],
};

export function resolveAppRole(role?: string | null): AppRole {
  if (role === "admin" || role === "coordinator" || role === "traffic" || role === "creator") return role;
  return "creator";
}

export function canAccessArea(role: string | null | undefined, area: AppArea) {
  return areasByRole[resolveAppRole(role)].includes(area);
}

export function areaFromPath(pathname: string): AppArea | null {
  if (pathname === "/app" || pathname === "/app/") return "dashboard";
  if (pathname.startsWith("/app/demandas")) return "demandas";
  if (pathname.startsWith("/app/clientes")) return "clientes";
  if (pathname.startsWith("/app/feedback")) return "feedback";
  if (pathname.startsWith("/app/cases")) return "cases";
  if (pathname.startsWith("/app/equipe")) return "equipe";
  if (pathname.startsWith("/app/gestao")) return "gestao";
  if (pathname.startsWith("/app/perfil") || pathname.startsWith("/app/configuracoes")) return "perfil";
  if (pathname.startsWith("/app/onboarding")) return null;
  if (pathname.startsWith("/app")) return "dashboard";
  return null;
}

export function canAccessPath(role: string | null | undefined, pathname: string) {
  const area = areaFromPath(pathname);
  if (!area) return true;
  return canAccessArea(role, area);
}

export function isOperationsRole(role: string | null | undefined) {
  return operations.includes(resolveAppRole(role));
}
