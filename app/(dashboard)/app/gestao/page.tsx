import { Kanban, ListChecks, Zap } from "lucide-react";
import Link from "next/link";
import { TeamStatusManager } from "@/components/dashboard/team-status-form";
import { listTeamStatuses } from "@/lib/team-status";

const links = [
  { href: "/app/gestao/espacos", label: "Espaços e fluxos", description: "Times, membros e as etapas de cada quadro.", icon: Kanban },
  { href: "/app/gestao/formularios", label: "Formulários", description: "O que cada pessoa preenche para abrir uma tarefa.", icon: ListChecks },
  { href: "/app/gestao/atalhos", label: "Atalho rápido", description: "Quais atalhos cada role vê no botão laranja.", icon: Zap },
];

export default async function GestaoPage() {
  const statuses = await listTeamStatuses();

  return (
    <div className="grid gap-10">
      <div>
        <p className="label text-primary">Gestão da plataforma</p>
        <h2 className="mt-2 font-display text-h2">Configuração do admin.</h2>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="surface grid gap-2 p-5 transition hover:border-primary/50">
            <item.icon className="size-5 text-primary" />
            <span className="font-medium">{item.label}</span>
            <span className="text-sm text-muted-foreground">{item.description}</span>
          </Link>
        ))}
      </section>

      <section className="grid gap-4">
        <h3 className="text-sm font-medium">Status de presença</h3>
        <TeamStatusManager statuses={statuses} />
      </section>
    </div>
  );
}
