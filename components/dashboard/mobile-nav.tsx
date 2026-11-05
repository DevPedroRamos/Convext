"use client";

import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { TeamStatus } from "@/lib/team-status-icons";

type MobileNavProps = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  role?: string | null;
  available?: boolean;
  statusId?: string | null;
  statuses?: TeamStatus[];
};

export function MobileNav(props: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden"><Menu /></Button></SheetTrigger>
      <SheetContent side="left" className="w-80 border-border bg-sidebar p-0"><AppSidebar {...props} className="border-r-0" /></SheetContent>
    </Sheet>
  );
}
