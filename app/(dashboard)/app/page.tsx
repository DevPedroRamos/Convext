import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAllCases } from "@/lib/cases";
import { listClients } from "@/lib/clients";
import { listDemands } from "@/lib/demands";
import { getCurrentUserProfile, isAdmin, listTeamProfiles, profileName } from "@/lib/profile";

function StatCard({
  title,
  value,
  hint,
  href,
}: {
  title: string;
  value: number;
  hint: string;
  href?: string;
}) {
  const card = (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl tracking-[-0.04em]">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );

  if (!href) return card;
  return (
    <Link href={href} className="rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring">
      {card}
    </Link>
  );
}

export default async function AppHomePage() {
  const [{ user, profile }, demands] = await Promise.all([
    getCurrentUserProfile(),
    listDemands(),
  ]);
  const firstName = profile?.first_name || profileName(profile, user?.email).split(" ")[0];
  const cargo = profile?.cargo?.trim() || "Cargo não informado";
  const email = user?.email || "";
  const openDemands = demands.filter(
    (demand) => demand.responsibleId === user?.id && demand.status !== "completed"
  ).length;
  const admin = isAdmin(profile);
  const [clients, cases, team] = admin
    ? await Promise.all([listClients(), listAllCases(), listTeamProfiles()])
    : [[], [], []];

  return (
    <div className="grid gap-6">
      <section className="surface relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(243,87,3,.22),transparent_30%)]" />
        <div className="relative z-10">
          <Badge>Convext Platform</Badge>
          <h2 className="mt-6 max-w-3xl font-display text-h2">Olá, {firstName}. Bem-vindo à Convext.</h2>
          <p className="mt-5 max-w-xl text-muted-foreground">{cargo} · {email}</p>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Demandas"
          value={admin ? demands.length : openDemands}
          hint={admin ? "total" : "em aberto"}
          href="/app/demandas"
        />
        {admin ? (
          <>
            <StatCard title="Clientes" value={clients.length} hint="total" href="/app/clientes" />
            <StatCard title="Cases" value={cases.length} hint="total" href="/app/cases" />
            <StatCard title="Equipe" value={team.length} hint="total" href="/app/equipe" />
          </>
        ) : null}
      </div>
    </div>
  );
}
