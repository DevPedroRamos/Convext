"use client";

import { usePathname } from "next/navigation";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import type { TeamStatus } from "@/lib/team-status-icons";

type HeaderProps = {
  title?: string;
  eyebrow?: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string | null;
  available?: boolean;
  statusId?: string | null;
  statuses?: TeamStatus[];
};

const titles: Record<string, string> = {
  "/app": "Dashboard",
  "/app/perfil": "Perfil",
  "/app/clientes": "Clientes",
  "/app/feedback": "Feedback",
  "/app/demandas": "Demandas",
  "/app/equipe": "Equipe",
  "/app/gestao": "Gestão da plataforma",
};

export function AppHeader({ title, eyebrow = "Área Convext", name, email, avatarUrl, role, available, statusId, statuses }: HeaderProps) {
  const pathname = usePathname();
  const currentTitle = title || titles[pathname] || (pathname.startsWith("/app/clientes") ? "Clientes" : "Dashboard");

  return (
    <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <MobileNav name={name} email={email} avatarUrl={avatarUrl} role={role} available={available} statusId={statusId} statuses={statuses} />
        <div><p className="label text-primary">{eyebrow}</p><h1 className="text-2xl tracking-[-.05em]">{currentTitle}</h1></div>
      </div>
    </header>
  );
}
