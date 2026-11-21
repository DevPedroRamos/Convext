"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { timeAgo } from "@/components/spaces/task-card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { AppNotification } from "@/lib/spaces/types";
import { cn } from "@/lib/utils";

export function NotificationsBell({ unread }: { unread: number }) {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [count, setCount] = useState(unread);
  const [lastUnread, setLastUnread] = useState(unread);
  if (unread !== lastUnread) {
    setLastUnread(unread);
    setCount(unread);
  }

  async function onOpenChange(open: boolean) {
    if (!open) return;
    const response = await fetch("/api/notifications").catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) : {};
    setItems(payload.data ?? []);
    if (count) {
      await fetch("/api/notifications", { method: "PATCH" }).catch(() => null);
      setCount(0);
      router.refresh();
    }
  }

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={count ? `Avisos: ${count} novos` : "Avisos"}>
          <Bell />
          {count ? <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{count > 9 ? "9+" : count}</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <p className="border-b border-border px-4 py-3 text-sm font-medium">Avisos</p>
        <div className="max-h-96 overflow-y-auto">
          {items === null ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum aviso. Eles chegam quando uma tarefa entra na sua etapa ou é concluída.</p>
          ) : (
            items.map((item) => (
              <Link key={item.id} href={item.spaceId ? `/app/espacos/${item.spaceId}` : "/app/tarefas"} className={cn("grid gap-1 border-b border-border/60 px-4 py-3 text-sm hover:bg-muted/40", !item.readAt && "bg-primary/5")}>
                <span>{item.message}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</span>
              </Link>
            ))
          )}
        </div>
        <Link href="/app/tarefas" className="block px-4 py-3 text-center text-sm text-primary hover:underline">Ver minhas tarefas</Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
