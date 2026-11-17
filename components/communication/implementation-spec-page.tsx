import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  FileCode2,
  KeyRound,
  Radio,
  Server,
  ShieldCheck,
  Smartphone,
  Users,
  Video,
  Webhook,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const phases = [
  { title: "Spike técnico", description: "Validar áudio, câmera, tela, reconexão, TURN, revogação e runtime de deploy." },
  { title: "Dados e autorização", description: "Criar schema, RLS, convites, leases, outbox e operações transacionais." },
  { title: "Fatia vertical de voz", description: "Catálogo, pré-entrada, join real, participantes, mute, saída e dock persistente." },
  { title: "Privacidade e chamadas", description: "Salas privadas, ringing, timeout, takeover, remoção e encerramento." },
  { title: "Vídeo e apresentação", description: "Galeria, palco, seletor nativo, cotas e estados de dispositivo." },
  { title: "Endurecimento", description: "Browsers, acessibilidade, concorrência, carga, observabilidade e rollout piloto." },
];

const acceptance = [
  "Todas as roles onboarded acessam Salas sem receber acesso à área administrativa Equipe.",
  "Sala privada não vaza nome, participantes ou existência pela URL, API ou Data API.",
  "Navegar para Demandas mantém a mesma chamada, sem áudio duplicado.",
  "Duas abas ou dispositivos não publicam ao mesmo tempo sem takeover explícito.",
  "Somente uma apresentação é admitida; perder a disputa encerra a captura local.",
  "Remoção ou encerramento bloqueia novo ingresso com credencial antiga.",
];

function ArchitectureNode({ icon: Icon, title, detail }: { icon: typeof Server; title: string; detail: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-secondary p-4 ring-1 ring-border">
      <Icon className="size-5 text-primary" />
      <p className="mt-4 font-medium">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

export function ImplementationSpecPage({ prototypeHref = "/app/salas" }: { prototypeHref?: string }) {
  return (
    <div className="grid gap-10">
      <header className="relative overflow-hidden rounded-2xl bg-card px-6 py-8 ring-1 ring-border sm:px-8 lg:px-10 lg:py-12">
        <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-[radial-gradient(circle_at_70%_35%,rgba(243,87,3,.28),transparent_42%)] lg:block" />
        <div className="relative max-w-3xl">
          <Badge variant="secondary">Spec de implementação · v1</Badge>
          <h2 className="mt-5 font-display text-4xl tracking-[-0.04em] sm:text-5xl lg:text-6xl">Comunicação em tempo real para a equipe.</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Plano técnico para salas abertas ou privadas, chamadas diretas, vídeo e compartilhamento de tela dentro da plataforma Convext.</p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Button asChild size="lg"><Link href={prototypeHref}><ArrowLeft /> Abrir protótipo</Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="#roadmap">Ir para o roadmap <ArrowRight /></Link></Button>
          </div>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="hidden self-start xl:sticky xl:top-28 xl:grid xl:gap-1" aria-label="Navegação da especificação">
          {[['#scope','Escopo'],['#model','Modelo'],['#architecture','Arquitetura'],['#data','Dados e segurança'],['#roadmap','Roadmap'],['#acceptance','Aceite']].map(([href,label]) => <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">{label}</Link>)}
        </nav>

        <article className="min-w-0 space-y-12">
          <section id="scope" className="scroll-mt-28">
            <h3 className="font-display text-3xl tracking-[-0.03em]">Escopo da primeira versão</h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">A primeira entrega atende somente membros autenticados da equipe. A experiência fica disponível para admin, coordinator, traffic e creator, com autorização específica por sala.</p>
            <div className="mt-7 grid gap-px overflow-hidden rounded-2xl bg-border ring-1 ring-border sm:grid-cols-2">
              <div className="bg-card p-6">
                <p className="font-medium text-emerald-300">Incluído</p>
                <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
                  {["Salas abertas e privadas", "Chamadas diretas e em grupo", "Microfone, câmera e apresentação", "Pré-entrada e seleção de dispositivos", "Moderação, reconexão e dock persistente"].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />{item}</li>)}
                </ul>
              </div>
              <div className="bg-card p-6">
                <p className="font-medium text-muted-foreground">Fora da v1</p>
                <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
                  {["Convidados externos", "Gravação e transcrição", "Chat textual persistente", "Telefonia e agendamento", "Aplicativos nativos e E2EE próprio"].map((item) => <li key={item} className="flex gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />{item}</li>)}
                </ul>
              </div>
            </div>
          </section>

          <section id="model" className="scroll-mt-28">
            <h3 className="font-display text-3xl tracking-[-0.03em]">Modelo de produto</h3>
            <div className="mt-6 overflow-hidden rounded-2xl bg-card ring-1 ring-border">
              {[{ term: "Sala", text: "Espaço persistente que pode existir vazio e receber vários encontros." }, { term: "Sessão", text: "Encontro ativo dentro de uma sala ou chamada direta temporária." }, { term: "Participação", text: "Presença de uma pessoa em uma sessão, com conexão e geração próprias." }, { term: "Apresentação", text: "Track separada para tela, janela ou aba; independente do microfone." }].map((row) => (
                <div key={row.term} className="grid gap-2 border-b border-border px-5 py-4 last:border-b-0 sm:grid-cols-[140px_1fr]"><p className="font-medium">{row.term}</p><p className="text-sm leading-6 text-muted-foreground">{row.text}</p></div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[{ icon: Users, value: "12", label: "participantes por sessão" }, { icon: Video, value: "6", label: "câmeras simultâneas" }, { icon: Smartphone, value: "1", label: "apresentação por sessão" }].map(({ icon: Icon, value, label }) => <div key={label} className="flex items-center gap-4 rounded-xl bg-secondary p-4 ring-1 ring-border"><Icon className="size-5 text-primary" /><div><p className="font-display text-2xl tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{label} · proposta</p></div></div>)}
            </div>
          </section>

          <section id="architecture" className="scroll-mt-28">
            <h3 className="font-display text-3xl tracking-[-0.03em]">Arquitetura proposta</h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">LiveKit Cloud fica responsável por sinalização e mídia. A Convext mantém identidade, autorização, salas e histórico operacional no Supabase. Áudio e vídeo não passam pelos Route Handlers.</p>
            <div className="mt-7 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
              <ArchitectureNode icon={FileCode2} title="Interface Convext" detail="Provider persistente, palco, controles e eventos do SDK." />
              <ArrowRight className="mx-auto hidden self-center text-muted-foreground lg:block" />
              <ArchitectureNode icon={Server} title="Backend Convext" detail="Autoriza ações, reserva cotas e emite credenciais mínimas." />
              <ArrowRight className="mx-auto hidden self-center text-muted-foreground lg:block" />
              <ArchitectureNode icon={Radio} title="Servidor de mídia" detail="Rooms, participantes, tracks, reconexão e transporte WebRTC." />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ArchitectureNode icon={Database} title="Supabase Postgres" detail="Salas, memberships, convites, sessões, leases, auditoria e RLS." />
              <ArchitectureNode icon={Webhook} title="Webhooks + reconciliação" detail="Eventos assinados, deduplicação, outbox e correção de divergências." />
            </div>
          </section>

          <section id="data" className="scroll-mt-28">
            <h3 className="font-display text-3xl tracking-[-0.03em]">Dados e segurança</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-card p-6 ring-1 ring-border"><KeyRound className="size-5 text-primary" /><h4 className="mt-5 font-medium">Credenciais efêmeras</h4><p className="mt-2 text-sm leading-6 text-muted-foreground">JWT de mídia emitido no servidor, vinculado a sessão, identidade e geração, com grants mínimos e resposta sem cache.</p></div>
              <div className="rounded-2xl bg-card p-6 ring-1 ring-border"><ShieldCheck className="size-5 text-primary" /><h4 className="mt-5 font-medium">Autorização em duas camadas</h4><p className="mt-2 text-sm leading-6 text-muted-foreground">RLS protege dados; operações do backend validam perfil, sala, restrições e cotas antes de comandar o provedor.</p></div>
            </div>
            <div className="mt-4 overflow-x-auto rounded-2xl bg-[#0a0a0a] p-5 ring-1 ring-border">
              <pre className="min-w-[640px] text-xs leading-6 text-muted-foreground"><code>{`communication_rooms\ncommunication_room_members\ncommunication_room_invites\ncommunication_sessions\ncommunication_call_invites\ncommunication_participations\ncommunication_user_leases\ncommunication_media_leases\ncommunication_session_restrictions\ncommunication_events + provider_events + outbox`}</code></pre>
            </div>
          </section>

          <section id="roadmap" className="scroll-mt-28">
            <h3 className="font-display text-3xl tracking-[-0.03em]">Roadmap de implementação</h3>
            <div className="relative mt-7 grid gap-0 overflow-hidden rounded-2xl bg-card ring-1 ring-border">
              {phases.map((phase, index) => (
                <article key={phase.title} className="grid gap-3 border-b border-border p-5 last:border-b-0 sm:grid-cols-[44px_180px_1fr] sm:items-start">
                  <span className="grid size-9 place-items-center rounded-full bg-primary font-medium text-primary-foreground">{index + 1}</span>
                  <h4 className="pt-1.5 font-medium">{phase.title}</h4>
                  <p className="pt-1 text-sm leading-6 text-muted-foreground">{phase.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="acceptance" className="scroll-mt-28 pb-8">
            <h3 className="font-display text-3xl tracking-[-0.03em]">Aceite essencial</h3>
            <div className="mt-6 grid gap-3">
              {acceptance.map((item, index) => <div key={item} className="flex gap-4 rounded-xl bg-secondary p-4 ring-1 ring-border"><span className="font-mono text-xs tabular-nums text-primary">A{String(index + 1).padStart(2, "0")}</span><p className="text-sm leading-6">{item}</p></div>)}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
