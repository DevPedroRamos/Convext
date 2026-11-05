"use client";

import { Briefcase, MessageSquare, Palette, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreatorDemandForm } from "@/components/forms/creator-demand-form";
import { FeedbackForm } from "@/components/forms/feedback-form";
import { ClientForm } from "@/components/forms/client-form";
import { CircularNavigation, type CircularNavItem } from "@/components/ui/circular-navigation-bar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PearlButton } from "@/components/ui/pearl-button";
import type { ClientRecord } from "@/lib/clients";
import type { FeedbackType } from "@/lib/feedback-types";
import type { CreatorOption, TeamProfile } from "@/lib/profile";

export function AppQuickActions({
  clients,
  team,
  types,
  creators,
}: {
  clients: ClientRecord[];
  team: TeamProfile[];
  types: FeedbackType[];
  creators: CreatorOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"feedback" | "client" | "demand" | null>(null);

  const items: CircularNavItem[] = [
    {
      id: "feedback",
      label: "Cadastrar Feedback",
      icon: MessageSquare,
      onSelect: () => setDialog("feedback"),
    },
    {
      id: "demand",
      label: "Cadastrar demanda",
      icon: Palette,
      onSelect: () => setDialog("demand"),
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl py-8">
          <DialogHeader>
            <DialogTitle>Cadastrar Feedback</DialogTitle>
            <DialogDescription>A demanda fica ligada ao cliente e herda o responsável atual.</DialogDescription>
          </DialogHeader>
          <FeedbackForm
            clients={clients}
            types={types}
            creators={creators}
            onCancel={() => setDialog(null)}
            onSuccess={() => {
              setDialog(null);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "demand"} onOpenChange={(next) => !next && setDialog(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl py-8">
          <DialogHeader>
            <DialogTitle>Cadastrar demanda</DialogTitle>
            <DialogDescription>Envia o briefing para o creator escolhido.</DialogDescription>
          </DialogHeader>
          <CreatorDemandForm
            clients={clients}
            creators={creators}
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
