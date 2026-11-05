"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { signOutOffline } from "@/lib/presence-session";
import { teamStatusIcon, type TeamStatus } from "@/lib/team-status-icons";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  available?: boolean;
  statusId?: string | null;
  statuses?: TeamStatus[];
};

export function UserMenu({
  name,
  email,
  avatarUrl,
  available = false,
  statusId = null,
  statuses = [],
}: UserMenuProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [presence, setPresence] = useState(available);
  const [currentStatusId, setCurrentStatusId] = useState(statusId || "none");
  const currentStatus = statuses.find((item) => item.id === (currentStatusId === "none" ? null : currentStatusId));
  const StatusIcon = currentStatus ? teamStatusIcon(currentStatus.icon) : null;

  useEffect(() => {
    setPresence(available);
  }, [available]);

  useEffect(() => {
    setCurrentStatusId(statusId || "none");
  }, [statusId]);

  async function signOut() {
    await signOutOffline();
    router.push("/login");
    router.refresh();
  }

  function patchPresence(next: boolean) {
    const previous = presence;
    setPresence(next);
    startTransition(async () => {
      const response = await fetch("/api/me/presence", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: next }),
      });
      if (!response.ok) {
        setPresence(previous);
        toast.error("Não foi possível atualizar a disponibilidade.");
        return;
      }
      router.refresh();
    });
  }

  function patchStatus(next: string) {
    const previous = currentStatusId;
    setCurrentStatusId(next);
    startTransition(async () => {
      const response = await fetch("/api/me/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId: next === "none" ? null : next }),
      });
      if (!response.ok) {
        setCurrentStatusId(previous);
        toast.error("Não foi possível atualizar o status.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-2xl px-3 py-2 text-left transition hover:bg-white/5">
        <span className="relative size-10 shrink-0">
          <Avatar className="size-10">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className={cn("absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-sidebar", presence ? "bg-emerald-400" : "bg-zinc-500")} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">{name}</span>
          {currentStatus && StatusIcon ? (
            <span className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <StatusIcon className="size-3 shrink-0" />
              <span className="truncate">{currentStatus.name}</span>
            </span>
          ) : (
            <span className="block truncate text-xs text-muted-foreground">{email}</span>
          )}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-64">
        <DropdownMenuLabel>
          <span className="block truncate text-foreground">{name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/perfil"><User /> Perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(event) => event.preventDefault()} className="justify-between gap-3">
          <span>{presence ? "Disponível" : "Ausente"}</span>
          <Switch checked={presence} disabled={pending} onCheckedChange={patchPresence} />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Status atual</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={currentStatusId} onValueChange={patchStatus}>
          <DropdownMenuRadioItem value="none">Nenhum</DropdownMenuRadioItem>
          {statuses.map((item) => {
            const Icon = teamStatusIcon(item.icon);
            return (
              <DropdownMenuRadioItem key={item.id} value={item.id} disabled={pending}>
                <Icon /> {item.name}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}><LogOut /> Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
