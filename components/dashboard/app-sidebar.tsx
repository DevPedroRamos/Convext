import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, Settings, UserRound } from "lucide-react";
import { UserMenu } from "@/components/dashboard/user-menu";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/perfil", label: "Perfil", icon: UserRound },
  { href: "/app/configuracoes", label: "Configurações", icon: Settings },
];

type SidebarProps = { name: string; email: string; avatarUrl?: string | null; className?: string };

export function AppSidebar({ name, email, avatarUrl, className }: SidebarProps) {
  return (
    <aside className={cn("flex h-full flex-col border-r border-border bg-sidebar p-4", className)}>
      <Link href="/app" className="mb-8 flex items-center gap-3 rounded-2xl px-2 py-3">
        <Image src="/brand/logo-lockup.png" alt="Convext" width={778} height={210} className="h-10 w-auto object-contain" />
      </Link>
      <nav className="grid gap-1">
        {items.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"><item.icon className="size-4" /> {item.label}</Link>)}
      </nav>
      <div className="mt-auto"><UserMenu name={name} email={email} avatarUrl={avatarUrl} /></div>
    </aside>
  );
}
