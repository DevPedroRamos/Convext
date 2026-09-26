import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserProfile, profileName } from "@/lib/profile";

export default async function AppHomePage() {
  const { user, profile } = await getCurrentUserProfile();
  const firstName = profile?.first_name || profileName(profile, user?.email).split(" ")[0];
  const cards = ["Projetos", "Campanhas", "Relatórios", "Equipe"];

  return (
    <div className="grid gap-6">
      <section className="surface relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(243,87,3,.22),transparent_30%)]" />
        <div className="relative z-10"><Badge>Convext Platform</Badge><h2 className="mt-6 max-w-3xl font-display text-h2">Olá, {firstName}. Bem-vindo à Convext.</h2><p className="mt-5 max-w-xl text-muted-foreground">Sua área restrita começa simples e já está preparada para clientes, projetos, campanhas e relatórios.</p></div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <Card key={card}><CardHeader><CardTitle>{card}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Módulo preparado para a próxima fase.</p></CardContent></Card>)}</div>
    </div>
  );
}
