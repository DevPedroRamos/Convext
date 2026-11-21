"use client";

import { usePathname } from "next/navigation";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import type { SidebarSpace } from "@/components/dashboard/sidebar-nav";
import { NotificationsBell } from "@/components/spaces/notifications-bell";
import type { TeamStatus } from "@/lib/team-status-icons";

type HeaderProps = {
  title?: string;
  eyebrow?: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string | null;
  available?: boolean;
  lastSeenAt?: string | null;
  statusId?: string | null;
  statuses?: TeamStatus[];
  spaces?: SidebarSpace[];
  unreadNotifications?: number;
};

const titles: Record<string, string> = {
  "/app": "Dashboard",
  "/app/perfil": "Perfil",
  "/app/clientes": "Clientes",
  "/app/tarefas": "Minhas tarefas",
  "/app/gestao/espacos": "Espaços e fluxos",
  "/app/gestao/formularios": "Formulários",
  "/app/gestao/atalhos": "Atalho rápido",
  "/app/salas": "Salas",
  "/app/chamadas": "Chamada",
  "/app/equipe": "Equipe",
  "/app/gestao": "Gestão da plataforma",
  "/app/financeiro": "Financeiro",
  "/app/financeiro/comercial": "Propostas",
  "/app/financeiro/leads": "Leads",
  "/app/financeiro/contratos": "Contratos",
  "/app/financeiro/clientes": "Clientes financeiros",
  "/app/financeiro/produtos": "Produtos",
  "/app/financeiro/admin": "Gerencial",
  "/app/financeiro/admin/folha": "Folha",
  "/app/financeiro/admin/balanco": "Balanço",
  "/app/financeiro/admin/gestao": "Gestão financeira",
};

export function AppHeader({ title, eyebrow = "Área Convext", name, email, avatarUrl, role, available, lastSeenAt, statusId, statuses, spaces, unreadNotifications = 0 }: HeaderProps) {
  const pathname = usePathname();
  const currentTitle = title || titles[pathname] || (pathname.startsWith("/app/financeiro/contratos") ? "Contrato" : pathname.startsWith("/app/financeiro") ? "Financeiro" : pathname.startsWith("/app/espacos") ? (spaces?.find((space) => pathname === `/app/espacos/${space.id}`)?.name ?? "Espaço") : pathname.startsWith("/app/clientes") ? "Clientes" : pathname.startsWith("/app/salas") ? "Salas" : pathname.startsWith("/app/chamadas") ? "Chamada" : "Dashboard");

  return (
    <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <MobileNav name={name} email={email} avatarUrl={avatarUrl} role={role} available={available} lastSeenAt={lastSeenAt} statusId={statusId} statuses={statuses} spaces={spaces} />
        <div><p className="label text-primary">{eyebrow}</p><h1 className="text-2xl tracking-[-.05em]">{currentTitle}</h1></div>
      </div>
      <NotificationsBell unread={unreadNotifications} />
    </header>
  );
}
