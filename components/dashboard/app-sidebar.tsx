import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "@/components/dashboard/user-menu";
import { SidebarNav, type SidebarSpace } from "@/components/dashboard/sidebar-nav";
import type { TeamStatus } from "@/lib/team-status-icons";
import { cn } from "@/lib/utils";

export type SidebarProps = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string | null;
  available?: boolean;
  lastSeenAt?: string | null;
  statusId?: string | null;
  statuses?: TeamStatus[];
  spaces?: SidebarSpace[];
  className?: string;
};

export function AppSidebar({
  name,
  email,
  avatarUrl,
  role,
  available,
  lastSeenAt,
  statusId,
  statuses,
  spaces,
  className,
}: SidebarProps) {
  return (
    <aside className={cn("flex h-full flex-col border-r border-border bg-sidebar p-4", className)}>
      <Link href="/app" className="mb-8 flex items-center gap-3 rounded-2xl px-2 py-3">
        <Image src="/brand/logo-lockup.png" alt="Convext" width={778} height={210} className="h-10 w-auto object-contain" />
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <SidebarNav role={role} spaces={spaces} />
      </div>
      <div className="mt-4 min-w-0 shrink-0 overflow-hidden">
        <UserMenu name={name} email={email} avatarUrl={avatarUrl} available={available} lastSeenAt={lastSeenAt} statusId={statusId} statuses={statuses} />
      </div>
    </aside>
  );
}
