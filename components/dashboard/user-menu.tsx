"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/browser";

type UserMenuProps = { name: string; email: string; avatarUrl?: string | null };

export function UserMenu({ name, email, avatarUrl }: UserMenuProps) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-white/5">
        <Avatar className="size-10"><AvatarImage src={avatarUrl || undefined} /><AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm">{name}</span><span className="block truncate text-xs text-muted-foreground">{email}</span></span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel><span className="block">{name}</span><span className="text-xs font-normal text-muted-foreground">{email}</span></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/app/perfil"><User /> Perfil</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/app/configuracoes"><Settings /> Configurações</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}><LogOut /> Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
