import type { Metadata } from "next";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { Badge } from "@/components/ui/badge";
import { Magnetic } from "@/components/motion/magnetic";
import { Button } from "@/components/ui/button";
import { RollLabel } from "@/components/ui/roll-label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = { title: "Design System" };

const easings = [
  ["Out expo", "--ease-out-expo · expo.out", "cubic-bezier(0.16, 1, 0.3, 1)", "Padrão: entradas, hovers, reveals"],
  ["Out quint", "--ease-out-quint", "cubic-bezier(0.23, 1, 0.32, 1)", "Pulsos e microinterações"],
  ["In-out", "--ease-in-out · power4.inOut", "cubic-bezier(0.65, 0, 0.35, 1)", "Cortinas e trocas de estado"],
];

const durations = [
  ["--dur-fast", "160ms", "Cor, opacidade, foco"],
  ["--dur-base", "280ms", "Hover de botão e link"],
  ["--dur-slow", "600ms", "Movimento, reveals, cards"],
];

const colors = [
  ["Orange", "#F35703"], ["Dark", "#0F0F0F"], ["Light", "#FCFCFC"], ["Surface", "#151515"], ["Surface 2", "#1B1B1B"], ["Border", "#292929"], ["Muted", "#898989"],
];

export default function DesignSystemPage() {
  return (
    <div className="pt-28">
      <Container className="py-12 sm:py-20">
        <p className="label text-primary">Convext UI</p>
        <h1 className="mt-5 font-display text-h1">Design system.</h1>
        <p className="mt-6 max-w-2xl text-foreground/65">Tokens, componentes e padrões para manter a experiência consistente entre site, auth e dashboard.</p>

        <Tabs defaultValue="tokens" className="mt-12">
          <TabsList className="bg-secondary"><TabsTrigger value="tokens">Tokens</TabsTrigger><TabsTrigger value="components">Componentes</TabsTrigger><TabsTrigger value="motion">Motion</TabsTrigger><TabsTrigger value="dashboard">Dashboard</TabsTrigger></TabsList>
          <TabsContent value="tokens" className="mt-8 grid gap-6">
            <section className="grid gap-4 md:grid-cols-4">
              {colors.map(([name, value]) => <FadeUp key={name} className="surface p-5"><div className="mb-5 h-20 rounded-2xl border border-white/10" style={{ background: value }} /><p className="font-medium">{name}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{value}</p></FadeUp>)}
            </section>
            <section className="surface p-6"><p className="label text-primary">Tipografia</p><div className="mt-6 space-y-4"><p className="font-display text-display">Archivo Display</p><p className="text-xl text-foreground/75">Calibri para interface, formulários, labels e dashboard.</p><p className="label">Label uppercase tracking .14em</p></div></section>
          </TabsContent>
          <TabsContent value="components" className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card><CardHeader><CardTitle>Buttons</CardTitle><CardDescription>Variantes base do shadcn adaptadas aos tokens Convext.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-3"><Button>Primary <ArrowUpRight /></Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button size="icon"><ArrowUpRight /></Button></CardContent></Card>
            <Card><CardHeader><CardTitle>Forms</CardTitle><CardDescription>Inputs, selects e estados de erro.</CardDescription></CardHeader><CardContent className="grid gap-4"><div className="grid gap-2"><Label>Nome</Label><Input placeholder="Pedro Ribeiro" /></div><div className="grid gap-2"><Label>Tipo</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="project">Novo projeto</SelectItem><SelectItem value="budget">Orçamento</SelectItem></SelectContent></Select></div><Textarea placeholder="Mensagem" /></CardContent></Card>
            <Card><CardHeader><CardTitle>Feedback</CardTitle><CardDescription>Badges, loaders e skeleton.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex gap-2"><Badge>New</Badge><Badge variant="secondary">Qualified</Badge><Badge variant="outline">Archived</Badge></div><Button disabled><Loader2 className="animate-spin" /> Enviando</Button><Skeleton className="h-16 w-full" /></CardContent></Card>
            <Card><CardHeader><CardTitle>Tabela</CardTitle><CardDescription>Base visual para dashboard.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Contato recebido</TableCell><TableCell><Badge>new</Badge></TableCell></TableRow></TableBody></Table></CardContent></Card>
          </TabsContent>
          <TabsContent value="motion" className="mt-8 grid gap-6">
            <section className="surface p-6">
              <p className="label text-primary">Curvas e durações</p>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">Passe o mouse em cada linha. CSS usa as variáveis de <code className="font-mono">globals.css</code>; GSAP usa <code className="font-mono">lib/motion.ts</code>.</p>
              <div className="mt-6 grid gap-3">
                {easings.map(([name, token, value, usage]) => (
                  <div key={name} className="group grid items-center gap-4 rounded-xl border border-border p-4 md:grid-cols-[220px_1fr]">
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{token}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{usage}</p>
                    </div>
                    <div className="relative h-10 overflow-hidden rounded-full bg-secondary">
                      <span className="absolute left-1 top-1 size-8 rounded-full bg-primary transition-[left] duration-1000 group-hover:left-[calc(100%-2.25rem)]" style={{ transitionTimingFunction: value }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {durations.map(([token, value, usage]) => (
                  <div key={token} className="rounded-xl border border-border p-4"><p className="font-mono text-sm">{token}</p><p className="mt-1 font-display text-3xl">{value}</p><p className="mt-2 text-xs text-muted-foreground">{usage}</p></div>
                ))}
              </div>
            </section>
            <section className="grid gap-6 lg:grid-cols-2">
              <Card><CardHeader><CardTitle>Botões com movimento</CardTitle><CardDescription><code className="font-mono">RollLabel</code> rola o texto, <code className="font-mono">.arrow-nudge</code> empurra a seta e <code className="font-mono">Magnetic</code> atrai o botão para o cursor.</CardDescription></CardHeader><CardContent className="flex flex-wrap items-center gap-4">
                <Button size="lg" className="h-11 rounded-full px-5"><RollLabel>Roll label</RollLabel> <ArrowUpRight className="arrow-nudge" /></Button>
                <Magnetic><Button size="lg" variant="outline" className="h-11 rounded-full px-5"><RollLabel>Magnético</RollLabel></Button></Magnetic>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>Links e cursor</CardTitle><CardDescription><code className="font-mono">.link-underline</code> e <code className="font-mono">data-cursor=&quot;Texto&quot;</code> para mostrar um rótulo no cursor (só no site).</CardDescription></CardHeader><CardContent className="flex flex-wrap items-center gap-6">
                <a href="#" className="link-underline text-foreground">Sublinhado que cresce</a>
                <div data-cursor="Ver" className="grid h-20 w-40 place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">Área com rótulo</div>
              </CardContent></Card>
            </section>
            <section className="grid gap-4 md:grid-cols-3">
              {["Spotlight", "Elevação", "Borda laranja"].map((title) => (
                <div key={title} data-spotlight className="surface surface-interactive p-6"><p className="label text-primary">.surface-interactive</p><p className="mt-4 font-display text-3xl tracking-[-0.05em]">{title}</p><p className="mt-3 text-sm text-muted-foreground">Card com brilho que segue o cursor, sobe 4px e ganha borda laranja.</p></div>
              ))}
            </section>
          </TabsContent>
          <TabsContent value="dashboard" className="mt-8"><div className="surface grid gap-6 p-6 lg:grid-cols-[260px_1fr]"><aside className="rounded-2xl bg-black/30 p-5"><p className="font-display text-3xl">Convext</p><div className="mt-8 space-y-2 text-sm text-muted-foreground"><p>Dashboard</p><p>Perfil</p><p>Configurações</p></div></aside><main className="grid gap-4"><div className="surface p-5"><p className="label">Header</p><h3 className="mt-2 text-2xl">Olá, Pedro.</h3></div><div className="grid gap-4 md:grid-cols-3"><div className="surface p-5">Projetos</div><div className="surface p-5">Performance</div><div className="surface p-5">Sessão</div></div></main></div></TabsContent>
        </Tabs>
      </Container>
    </div>
  );
}
