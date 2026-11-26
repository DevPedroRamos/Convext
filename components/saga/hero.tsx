import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { HeroVisual } from "@/components/saga/hero-visual";
import { Magnetic } from "@/components/motion/magnetic";
import { hero } from "@/lib/saga-content";

const at = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

// Coreografia de entrada (única da página):
// título = protagonista, linhas com intervalos decrescentes (90 → 70 → 60ms);
// texto e CTAs = apoio, sobem pouco; rótulo e prova = decoração, só opacidade.
const lineDelays = [80, 170, 240, 300];

export function SagaHero() {
  return (
    <section id="inicio" className="relative isolate flex min-h-svh flex-col overflow-hidden bg-ink">
      <HeroVisual />
      {/* Véu para leitura: escuro à esquerda no desktop, embaixo no mobile */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#0b0b0b_42%,rgba(11,11,11,.6)_68%,rgba(11,11,11,.15))] lg:bg-[linear-gradient(to_right,#0b0b0b_22%,rgba(11,11,11,.7)_42%,transparent_68%)]" />

      <div className="container-convext relative z-10 flex flex-1 flex-col justify-end pb-28 pt-28 sm:pb-32 lg:justify-center lg:pb-20">
        <p className="saga-eyebrow saga-fade-only max-w-md text-foreground/60" style={at(0)}>
          {hero.eyebrow}
        </p>

        <h1 className="saga-title mt-7 text-[clamp(3rem,6.2vw,7rem)] text-foreground">
          {hero.lines.map((line, index) => (
            <span key={line} className="saga-rise">
              <span style={at(lineDelays[index])}>{line}</span>
            </span>
          ))}
          <span className="saga-rise">
            <span style={at(lineDelays[3])}>
              <em>{hero.accent}</em>
            </span>
          </span>
        </h1>

        <div className="saga-fade mt-7 max-w-[44ch]" style={at(420)}>
          <p className="text-lg leading-7 text-foreground sm:text-xl sm:leading-8">{hero.lead}</p>
          <p className="mt-2 text-base leading-7 text-foreground/60 sm:text-lg">{hero.body}</p>
        </div>

        <div className="saga-fade mt-8 flex flex-wrap items-center gap-3" style={at(500)}>
          <Magnetic strength={0.25}>
          <Link
            href="#diagnostico"
            className="saga-press group inline-flex h-12 items-center gap-2 rounded-full bg-primary pl-6 pr-5 text-sm text-primary-foreground hover:bg-[#ff6512]"
          >
            Solicitar diagnóstico <ArrowUpRight className="arrow-nudge size-4" />
          </Link>
          </Magnetic>
          <Link
            href="#metodo"
            className="saga-press inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-6 text-sm text-foreground hover:border-white/40"
          >
            Conhecer o Método Saga <ArrowDown className="size-4" />
          </Link>
        </div>

        <dl className="saga-fade-only mt-10 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-6" style={at(620)}>
          {hero.proof.map((item) => (
            <div key={item.label}>
              <dt className="sr-only">{item.label}</dt>
              <dd className="font-display text-xl tracking-[-0.04em] tabular-nums text-foreground sm:text-2xl">{item.value}</dd>
              <dd aria-hidden="true" className="mt-1 text-xs text-foreground/50">{item.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
