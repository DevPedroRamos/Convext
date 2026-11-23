"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ClientFormSheet } from "@/components/dashboard/client-form-sheet";
import { Button } from "@/components/ui/button";
import type { TeamProfile } from "@/lib/profile";

export function NewClientDialog({ team }: { team: TeamProfile[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setOpen(true)}>
        <Plus /> Novo cliente
      </Button>
      <ClientFormSheet team={team} open={open} onOpenChange={setOpen} />
    </>
  );
}
