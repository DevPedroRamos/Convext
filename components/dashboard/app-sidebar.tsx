import Image from "next/image";
import Link from "next/link";
import { Briefcase, Kanban, LayoutDashboard, MessageSquare, Settings2, Users, UsersRound } from "lucide-react";
import { UserMenu } from "@/components/dashboard/user-menu";
import { canAccessPath } from "@/lib/access";
import type { TeamStatus } from "@/lib/team-status-icons";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/clientes", label: "Clientes", icon: Users },
  { href: "/app/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/app/demandas", label: "Demandas", icon: Kanban },
  { href: "/app/cases", label: "Cases", icon: Briefcase },
  { href: "/app/equipe", label: "Equipe", icon: UsersRound },
  { href: "/app/gestao", label: "Gestão da plataforma", icon: Settings2 },
];

export type SidebarProps = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string | null;
  available?: boolean;
  statusId?: string | null;
  statuses?: TeamStatus[];
  className?: string;
};

export function AppSidebar({
  name,
  email,
  avatarUrl,
  role,
  available,
  statusId,
  statuses,
  className,
}: SidebarProps) {
  const visible = items.filter((item) => canAccessPath(role, item.href));

  return (
    <aside className={cn("flex h-full flex-col border-r border-border bg-sidebar p-4", className)}>
      <Link href="/app" className="mb-8 flex items-center gap-3 rounded-2xl px-2 py-3">
        <Image src="/brand/logo-lockup.png" alt="Convext" width={778} height={210} className="h-10 w-auto object-contain" />
      </Link>
      <nav className="grid gap-1">
        {visible.map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground">
            <item.icon className="size-4" /> {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto min-w-0 overflow-hidden">
        <UserMenu name={name} email={email} avatarUrl={avatarUrl} available={available} statusId={statusId} statuses={statuses} />
      </div>
    </aside>
  );
}
