"use client";

import { useRouter } from "next/navigation";
import { ClientDeleteButton } from "@/components/dashboard/client-delete-button";
import { ClientForm } from "@/components/forms/client-form";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ClientRecord } from "@/lib/clients";
import type { TeamProfile } from "@/lib/profile";

export function ClientFormSheet({
  team,
  record,
  open,
  onOpenChange,
  canDelete = false,
}: {
  team: TeamProfile[];
  record?: ClientRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const editing = Boolean(record);

  function closeAndRefresh() {
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="panel">
        <SheetHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-1">
              <SheetTitle>{editing ? `Editar ${record?.name}` : "Novo cliente"}</SheetTitle>
              <SheetDescription>
                {editing ? "Atualize o contato comercial sem sair da lista." : "Cadastre o contato comercial sem sair da lista."}
              </SheetDescription>
            </div>
            {editing && record && canDelete ? (
              <ClientDeleteButton id={record.id} name={record.name} onDeleted={closeAndRefresh} />
            ) : null}
          </div>
        </SheetHeader>
        {open ? (
          <ClientForm
            key={record?.id ?? "new"}
            team={team}
            record={record ?? undefined}
            onCancel={() => onOpenChange(false)}
            onSuccess={closeAndRefresh}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
