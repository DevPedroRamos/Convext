import type { Metadata } from "next";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { FadeUp } from "@/components/motion/fade-up";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = { title: "Design System" };

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
          <TabsList className="bg-secondary"><TabsTrigger value="tokens">Tokens</TabsTrigger><TabsTrigger value="components">Componentes</TabsTrigger><TabsTrigger value="dashboard">Dashboard</TabsTrigger></TabsList>
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
          <TabsContent value="dashboard" className="mt-8"><div className="surface grid gap-6 p-6 lg:grid-cols-[260px_1fr]"><aside className="rounded-2xl bg-black/30 p-5"><p className="font-display text-3xl">Convext</p><div className="mt-8 space-y-2 text-sm text-muted-foreground"><p>Dashboard</p><p>Perfil</p><p>Configurações</p></div></aside><main className="grid gap-4"><div className="surface p-5"><p className="label">Header</p><h3 className="mt-2 text-2xl">Olá, Pedro.</h3></div><div className="grid gap-4 md:grid-cols-3"><div className="surface p-5">Projetos</div><div className="surface p-5">Performance</div><div className="surface p-5">Sessão</div></div></main></div></TabsContent>
        </Tabs>
      </Container>
    </div>
  );
}
