"use client";

import { Briefcase, FileText, Target, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClientForm } from "@/components/forms/client-form";
import { type ClientOption, TaskFormDialog } from "@/components/spaces/task-form-dialog";
import { CircularNavigation, type CircularNavItem } from "@/components/ui/circular-navigation-bar";
import { PearlButton } from "@/components/ui/pearl-button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { TeamProfile } from "@/lib/profile";
import type { QuickAction, Space, SpaceForm } from "@/lib/spaces/types";

type Props = {
  /** Atalhos já filtrados para a role de quem está vendo. */
  actions: QuickAction[];
  forms: SpaceForm[];
  spaces: Space[];
  clients: ClientOption[];
  team: TeamProfile[];
};

const systemIcons = { case: Briefcase, client: UserPlus, lead: Target } as const;

export function AppQuickActions({ actions, forms, spaces, clients, team }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [form, setForm] = useState<SpaceForm | null>(null);

  const items: CircularNavItem[] = actions.flatMap((action): CircularNavItem[] => {
    if (action.kind === "form") {
      const target = forms.find((item) => item.id === action.formId);
      if (!target) return [];
      return [{ id: action.id, label: action.label, icon: FileText, onSelect: () => setForm(target) }];
    }
    const icon = systemIcons[action.systemAction ?? "case"];
    if (action.systemAction === "client") return [{ id: action.id, label: action.label, icon, onSelect: () => setClientOpen(true) }];
    if (action.systemAction === "lead") return [{ id: action.id, label: action.label, icon, onSelect: () => router.push("/app/financeiro/leads") }];
    return [{ id: action.id, label: action.label, icon, onSelect: () => router.push("/app/cases/novo") }];
  });

  if (!items.length) return null;

  return (
    <>
      <div className="fixed right-6 bottom-[calc(1.5rem+var(--call-dock-offset,0px))] z-40 size-[4.5rem] overflow-visible">
        <CircularNavigation items={items} isOpen={open} onClose={() => setOpen(false)} />
        <PearlButton open={open} className="relative z-50" aria-label={open ? "Fechar atalhos" : "Abrir atalhos"} onClick={() => setOpen((current) => !current)} />
      </div>

      <TaskFormDialog form={form} space={form ? spaces.find((space) => space.id === form.spaceId) ?? null : null} clients={clients} onOpenChange={(next) => !next && setForm(null)} />

      <Sheet open={clientOpen} onOpenChange={setClientOpen}>
        <SheetContent size="panel">
          <SheetHeader>
            <SheetTitle>Novo cliente</SheetTitle>
            <SheetDescription>Cadastre o contato comercial sem sair da página.</SheetDescription>
          </SheetHeader>
          <ClientForm
            team={team}
            onCancel={() => setClientOpen(false)}
            onSuccess={() => {
              setClientOpen(false);
              router.refresh();
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
