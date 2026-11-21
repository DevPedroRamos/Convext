"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClientForm } from "@/components/forms/client-form";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { TeamProfile } from "@/lib/profile";

export function NewClientDialog({ team }: { team: TeamProfile[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setOpen(true)}>
        <Plus /> Novo cliente
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="panel">
          <SheetHeader>
            <SheetTitle>Novo cliente</SheetTitle>
            <SheetDescription>Cadastre o contato comercial sem sair da lista.</SheetDescription>
          </SheetHeader>
          <ClientForm
            team={team}
            onCancel={() => setOpen(false)}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
