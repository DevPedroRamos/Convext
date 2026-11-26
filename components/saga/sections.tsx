import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Piece } from "@/components/saga/piece";
import { ProblemLine } from "@/components/saga/problem-line";
import { audience, numbers, problem, sagaOs, team } from "@/lib/saga-content";
import { cn } from "@/lib/utils";

/**
 * Seções estáticas da home. Sem reveal ao rolar: o conteúdo já está lá
 * quando o visitante chega — o movimento fica reservado ao hero e ao tabuleiro.
 */

export function SectionHeading({
  eyebrow,
  index,
  children,
  className,
  tone = "dark",
}: {
  eyebrow: string;
  index: string;
  children: React.ReactNode;
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <div className={className}>
      <p className={cn("saga-eyebrow", tone === "dark" ? "text-foreground/55" : "text-ink/55")}>
        <span className="tabular-nums">{index}</span>
        <span aria-hidden="true">—</span>
        {eyebrow}
      </p>
      <h2 className="saga-title saga-h2 mt-6">{children}</h2>
    </div>
  );
}

export function Numbers() {
  return (
    <section className="bg-ink py-24 sm:py-32">
      <div className="container-convext">
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-end">
          <SectionHeading index="01" eyebrow={numbers.eyebrow}>
            {numbers.title}
          </SectionHeading>
          <p className="max-w-[46ch] text-base leading-7 text-foreground/55">{numbers.body}</p>
        </div>

        <dl className="mt-16 grid grid-cols-2 border-t border-white/10 sm:grid-cols-3 lg:grid-cols-5">
          {numbers.items.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                "flex flex-col-reverse gap-3 border-b border-white/10 py-8 pr-6 lg:border-b-0",
                index > 0 && "lg:border-l lg:pl-6",
                index % 2 === 1 && "max-lg:border-l max-lg:pl-6 sm:max-lg:border-l-0 sm:max-lg:pl-0",
              )}
            >
              <dt className="text-sm text-foreground/50">{item.label}</dt>
              <dd className="whitespace-nowrap font-display text-[clamp(2.25rem,3.4vw,3.5rem)] leading-none tracking-[-0.06em] tabular-nums text-foreground">
                <span className="text-foreground/40">{item.prefix}</span>
                {item.value}
                <span className="text-primary">{item.suffix}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function Problem() {
  return (
    <section className="saga-light py-24 sm:py-32" data-header-theme="light">
      <div className="container-convext">
        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-end">
          <SectionHeading index="02" eyebrow={problem.eyebrow} tone="light">
            {problem.title[0]}
            <br />
            {problem.title[1]} <em>{problem.accent}</em>
          </SectionHeading>
          <p className="max-w-[46ch] text-base leading-7 text-ink/65">{problem.body}</p>
        </div>

        {/* Quatro casas ligadas por uma única linha: o sistema, não as peças soltas */}
        <div data-pillars className="relative mt-20">
          <ProblemLine />
          <ol className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {problem.pillars.map((pillar, index) => (
              <li key={pillar.title} className="relative">
                <span aria-hidden="true" className="pillar-node relative block size-[11px] bg-ink" />
                <p className="mt-8 font-mono text-xs tabular-nums text-ink/45">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 font-display text-2xl tracking-[-0.04em]">{pillar.title}</h3>
                <p className="mt-3 max-w-[30ch] text-[15px] leading-6 text-ink/65">{pillar.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function Audience() {
  return (
    <section className="bg-ink py-24 sm:py-32">
      <div className="container-convext">
        <SectionHeading index="05" eyebrow={audience.eyebrow}>
          {audience.title} <em>{audience.accent}</em>
        </SectionHeading>
        <ol className="mt-16 grid border-t border-white/10 lg:grid-cols-3">
          {audience.items.map((item, index) => (
            <li key={item.title} className={cn("border-b border-white/10 py-10 lg:border-b-0 lg:pr-10", index > 0 && "lg:border-l lg:pl-10")}>
              <p className="font-display text-5xl leading-none tracking-[-0.06em] text-primary">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-8 font-display text-2xl tracking-[-0.04em]">{item.title}</h3>
              <p className="mt-3 max-w-[38ch] text-[15px] leading-6 text-foreground/55">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const bars = [34, 46, 41, 58, 52, 67, 61, 78, 72, 88, 84, 96];

export function SagaOs() {
  return (
    <section id="saga-os" className="relative overflow-hidden bg-ink py-24 sm:py-32">
      <div className="container-convext grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeading index="06" eyebrow={sagaOs.eyebrow}>
            {sagaOs.title}
            <br />
            <em>{sagaOs.accent}</em>
          </SectionHeading>
          <p className="mt-8 max-w-[46ch] text-base leading-7 text-foreground/60">{sagaOs.body}</p>
          <ul className="mt-8 space-y-3">
            {sagaOs.bullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-3 text-[15px] text-foreground/80">
                <span aria-hidden="true" className="size-1.5 bg-primary" />
                {bullet}
              </li>
            ))}
          </ul>
          <Link href="/login" className="saga-press mt-10 inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm hover:border-white/40">
            Entrar no Saga OS <ArrowUpRight className="arrow-nudge size-4" />
          </Link>
        </div>

        {/* Ilustração do portal: estática, é um retrato do produto, não um dado a ler */}
        <figure aria-label="Prévia do painel Saga OS" className="rounded-2xl border border-white/10 bg-[#111] p-2 shadow-[0_40px_120px_-40px_rgba(243,87,3,.35)]">
          <div className="flex items-center gap-1.5 px-3 py-2">
            <span className="size-2 rounded-full bg-white/15" />
            <span className="size-2 rounded-full bg-white/15" />
            <span className="size-2 rounded-full bg-white/15" />
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/35">Saga OS · Painel do cliente</span>
          </div>
          <div className="grid grid-cols-[7rem_1fr] gap-2 rounded-xl bg-ink p-2 max-sm:grid-cols-1">
            <div className="space-y-1.5 rounded-lg bg-white/[0.03] p-3 max-sm:hidden">
              {["Resultados", "Campanhas", "Entregas", "Agenda", "Relatórios"].map((item, index) => (
                <p key={item} className={cn("rounded-md px-2 py-1.5 text-[11px]", index === 0 ? "bg-primary/15 text-primary" : "text-foreground/40")}>{item}</p>
              ))}
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Oportunidades", value: "1.284" },
                  { label: "Custo por oport.", value: "R$ 38" },
                  { label: "Visitas ao stand", value: "212" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-lg bg-white/[0.03] p-3">
                    <p className="truncate text-[10px] text-foreground/40">{kpi.label}</p>
                    <p className="mt-1 font-display text-lg tracking-[-0.04em] tabular-nums sm:text-xl">{kpi.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-white/[0.03] p-4">
                <p className="text-[10px] text-foreground/40">Oportunidades por semana</p>
                <div className="mt-4 flex h-36 items-end gap-1.5">
                  {bars.map((height, index) => (
                    <span
                      key={index}
                      className={cn("flex-1 rounded-t-[3px]", index === bars.length - 1 ? "bg-primary" : "bg-white/12")}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <figcaption className="sr-only">Ilustração com números de exemplo.</figcaption>
        </figure>
      </div>
    </section>
  );
}

export function Team() {
  return (
    <section id="quem-somos" className="bg-ink py-24 sm:py-32">
      <div className="container-convext grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-center">
        <blockquote className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111] p-8 sm:p-12">
          <Piece kind="king" className="pointer-events-none absolute -bottom-10 -right-6 h-72 w-auto text-primary/[0.07]" />
          <p className="relative font-display text-[clamp(2rem,3.6vw,3.25rem)] leading-[1] tracking-[-0.05em]">
            {team.quote}
            <br />
            <span className="text-primary">{team.quoteAccent}</span>
          </p>
        </blockquote>
        <div>
          <SectionHeading index="08" eyebrow={team.eyebrow}>
            {team.title}
            <br />
            <em>{team.accent}</em>
          </SectionHeading>
          <p className="mt-8 max-w-[50ch] text-base leading-7 text-foreground/60">{team.body}</p>
          <Link href="#diagnostico" className="saga-press mt-10 inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm hover:border-white/40">
            Conversar com os sócios <ArrowUpRight className="arrow-nudge size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
