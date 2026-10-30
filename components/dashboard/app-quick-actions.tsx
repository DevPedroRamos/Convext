"use client";

import { Briefcase, MessageSquare, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FeedbackForm } from "@/components/forms/feedback-form";
import { ClientForm } from "@/components/forms/client-form";
import { CircularNavigation, type CircularNavItem } from "@/components/ui/circular-navigation-bar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PearlButton } from "@/components/ui/pearl-button";
import type { ClientRecord } from "@/lib/clients";
import type { TeamProfile } from "@/lib/profile";

export function AppQuickActions({
  clients,
  team,
}: {
  clients: ClientRecord[];
  team: TeamProfile[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"feedback" | "client" | null>(null);

  const items: CircularNavItem[] = [
    {
      id: "feedback",
      label: "Cadastrar Feedback",
      icon: MessageSquare,
      onSelect: () => setDialog("feedback"),
    },
    {
      id: "client",
      label: "Novo Cliente",
      icon: UserPlus,
      onSelect: () => setDialog("client"),
    },
    {
      id: "case",
      label: "Novo Case",
      icon: Briefcase,
      onSelect: () => router.push("/app/cases/novo"),
    },
    { id: "soon-a", label: "Mais funções em breve...", icon: Briefcase, locked: true },
    { id: "soon-b", label: "Mais funções em breve...", icon: Briefcase, locked: true },
  ];

  return (
    <>
      <div className="fixed right-6 bottom-6 z-40 size-[4.5rem] overflow-visible">
        <CircularNavigation items={items} isOpen={open} onClose={() => setOpen(false)} />
        <PearlButton
          open={open}
          className="relative z-50"
          aria-label={open ? "Fechar atalhos" : "Abrir atalhos"}
          onClick={() => setOpen((current) => !current)}
        />
      </div>

      <Dialog open={dialog === "feedback"} onOpenChange={(next) => !next && setDialog(null)}>
        <DialogContent className="sm:max-w-lg py-8">
          <DialogHeader>
            <DialogTitle>Cadastrar Feedback</DialogTitle>
            <DialogDescription>A demanda fica ligada ao cliente e herda o responsável atual.</DialogDescription>
          </DialogHeader>
          <FeedbackForm
            clients={clients}
            onCancel={() => setDialog(null)}
            onSuccess={() => {
              setDialog(null);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "client"} onOpenChange={(next) => !next && setDialog(null)}>
        <DialogContent className="sm:max-w-lg py-8">
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
            <DialogDescription>Cadastre o contato comercial sem sair da página.</DialogDescription>
          </DialogHeader>
          <ClientForm
            team={team}
            onCancel={() => setDialog(null)}
            onSuccess={() => {
              setDialog(null);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
