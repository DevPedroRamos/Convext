"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
  Briefcase,
  ChevronDown,
  FileSignature,
  FileText,
  Headphones,
  CalendarDays,
  LayoutDashboard,
  ListTodo,
  type LucideIcon,
  Package,
  PieChart,
  Receipt,
  Scale,
  ScrollText,
  Settings2,
  Shield,
  SlidersHorizontal,
  Target,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { canAccessPath } from "@/lib/access";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };
type NavSection = { label: string; items: NavItem[] };

const items: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/tarefas", label: "Minhas tarefas", icon: ListTodo },
  { href: "/app/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/app/clientes", label: "Clientes", icon: Users },
  { href: "/app/salas", label: "Salas", icon: Headphones },
  { href: "/app/cases", label: "Cases", icon: Briefcase },
];

const financeSections: NavSection[] = [
  {
    label: "Comercial",
    items: [
      { href: "/app/financeiro", label: "Dashboard", icon: PieChart, exact: true },
      { href: "/app/financeiro/comercial", label: "Propostas", icon: FileText },
      { href: "/app/financeiro/leads", label: "Leads", icon: Target },
      { href: "/app/financeiro/contratos", label: "Contratos", icon: FileSignature },
      { href: "/app/financeiro/clientes", label: "Clientes", icon: Users },
      { href: "/app/financeiro/produtos", label: "Produtos", icon: Package },
    ],
  },
];

const adminSections: NavSection[] = [
  {
    label: "Plataforma",
    items: [
      { href: "/app/equipe", label: "Equipe", icon: UsersRound },
      { href: "/app/gestao", label: "Gestão da plataforma", icon: Settings2 },
      { href: "/app/gestao/logs", label: "Logs", icon: ScrollText },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { href: "/app/financeiro/admin", label: "Gerencial", icon: LayoutDashboard, exact: true },
      { href: "/app/financeiro/admin/folha", label: "Folha", icon: Receipt },
      { href: "/app/financeiro/admin/balanco", label: "Balanço", icon: Scale },
      { href: "/app/financeiro/admin/gestao", label: "Gestão", icon: SlidersHorizontal },
    ],
  },
];

const FINANCE_OPEN_KEY = "convext:sidebar:financeiro";
const ADMIN_OPEN_KEY = "convext:sidebar:admin";

function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readStoredOpen(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function useNavOpen(key: string, inSection: boolean, pathname: string) {
  const storedOpen = useSyncExternalStore(subscribeStorage, () => readStoredOpen(key), () => false);
  const [manual, setManual] = useState<{ open: boolean; path: string } | null>(null);
  const open = manual && manual.path === pathname ? manual.open : inSection || storedOpen;
  function toggle(next: boolean) {
    setManual({ open: next, path: pathname });
    try {
      window.localStorage.setItem(key, next ? "1" : "0");
    } catch {
      // Armazenamento indisponível: o estado vale só nesta página.
    }
  }
  return { open, toggle };
}

function isActive(pathname: string, item: NavItem) {
  if (item.href === "/app/gestao" && pathname.startsWith("/app/gestao/logs")) return false;
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavLink({ item, pathname, nested, badge }: { item: NavItem; pathname: string; nested?: boolean; badge?: number }) {
  const active = isActive(pathname, item);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground",
        nested ? "py-2" : "py-2.5",
        active && "bg-sidebar-accent text-foreground",
      )}
    >
      <item.icon className="size-4" /> {item.label}
      {badge ? <span className="ml-auto font-mono text-[11px] text-primary">{badge}</span> : null}
    </Link>
  );
}

export type SidebarSpace = { id: string; name: string; color: string; count: number; member: boolean };

export function SidebarNav({ role, spaces = [] }: { role?: string | null; spaces?: SidebarSpace[] }) {
  const pathname = usePathname() ?? "";
  const visible = items.filter((item) => canAccessPath(role, item.href));
  const sections = financeSections
    .map((section) => ({ ...section, items: section.items.filter((item) => canAccessPath(role, item.href)) }))
    .filter((section) => section.items.length > 0);
  const adminNav = adminSections
    .map((section) => ({ ...section, items: section.items.filter((item) => canAccessPath(role, item.href)) }))
    .filter((section) => section.items.length > 0);
  const inFinance = pathname === "/app/financeiro" || (pathname.startsWith("/app/financeiro/") && !pathname.startsWith("/app/financeiro/admin"));
  const inAdmin = pathname.startsWith("/app/equipe") || pathname.startsWith("/app/gestao") || pathname.startsWith("/app/financeiro/admin");
  const finance = useNavOpen(FINANCE_OPEN_KEY, inFinance, pathname);
  const admin = useNavOpen(ADMIN_OPEN_KEY, inAdmin, pathname);

  return (
    <nav className="grid gap-1">
      {visible.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} badge={item.href === "/app/tarefas" ? spaces.reduce((sum, space) => sum + space.count, 0) : undefined} />
      ))}
      {spaces.length && canAccessPath(role, "/app/espacos") ? (
        <div className="mt-3 grid gap-0.5">
          <p className="px-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">Espaços</p>
          {spaces.map((space) => {
            const href = `/app/espacos/${space.id}`;
            const active = pathname === href;
            return (
              <Link key={space.id} href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground", active && "bg-sidebar-accent text-foreground")}>
                <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: space.color }} />
                <span className="truncate">{space.name}</span>
                {space.count ? <span className="ml-auto font-mono text-[11px] text-primary">{space.count}</span> : !space.member ? <span className="ml-auto text-[10px] text-muted-foreground/70">só minhas</span> : null}
              </Link>
            );
          })}
        </div>
      ) : null}
      {sections.length > 0 ? (
        <Collapsible open={finance.open} onOpenChange={finance.toggle}>
          <CollapsibleTrigger
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground",
              inFinance && "text-foreground",
            )}
          >
            <Wallet className="size-4" /> Financeiro
            <ChevronDown className={cn("ml-auto size-4 transition-transform", finance.open && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="grid gap-3 overflow-hidden pt-1 pl-4">
            {sections.map((section) => (
              <div key={section.label} className="grid gap-0.5 border-l border-border pl-2">
                <p className="px-3 pt-1 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">{section.label}</p>
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} nested />
                ))}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
      {adminNav.length > 0 ? (
        <Collapsible open={admin.open} onOpenChange={admin.toggle}>
          <CollapsibleTrigger
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground",
              inAdmin && "text-foreground",
            )}
          >
            <Shield className="size-4" /> Área administrativa
            <ChevronDown className={cn("ml-auto size-4 transition-transform", admin.open && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="grid gap-3 overflow-hidden pt-1 pl-4">
            {adminNav.map((section) => (
              <div key={section.label} className="grid gap-0.5 border-l border-border pl-2">
                <p className="px-3 pt-1 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">{section.label}</p>
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} nested />
                ))}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </nav>
  );
}
