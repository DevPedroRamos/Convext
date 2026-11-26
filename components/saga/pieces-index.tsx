"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { Piece } from "@/components/saga/piece";
import { BeamsBackground } from "@/components/ui/beams-background";
import { SectionHeading } from "@/components/saga/sections";
import { pieces } from "@/lib/saga-content";
import { cn } from "@/lib/utils";

/**
 * Índice das cinco soluções. Abrir uma peça é a única interação: o painel
 * cresce no lugar (acordeão) e, no desktop, a peça grande troca por crossfade.
 */
const PieceStage = dynamic(() => import("@/components/saga/piece-stage"), { ssr: false });
const kinds = pieces.items.map((item) => item.kind);

export function PiecesIndex() {
  const [open, setOpen] = useState(0);
  const baseId = useId();

  return (
    <section id="solucoes" className="bg-ink py-24 sm:py-32">
      <div className="container-convext">
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-end">
          <SectionHeading index="04" eyebrow={pieces.eyebrow}>
            {pieces.title} <em>{pieces.accent}</em>
          </SectionHeading>
          <p className="max-w-[46ch] text-base leading-7 text-foreground/55">{pieces.body}</p>
        </div>

        <div className="mt-16 grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Palco 3D (decorativo): a peça escolhida emerge do pedestal sob feixes de luz laranja */}
          <div aria-hidden="true" className="relative">
            <BeamsBackground intensity="medium" className="aspect-[4/3] rounded-2xl border border-white/10 lg:sticky lg:top-28 lg:aspect-[4/5]">
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink to-transparent" />
              <PieceStage kinds={kinds} active={Math.max(open, 0)} />
              <p className="absolute bottom-5 left-6 font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/45">
                {String(Math.max(open, 0) + 1).padStart(2, "0")} / 05 · {pieces.items[Math.max(open, 0)].name}
              </p>
            </BeamsBackground>
          </div>

          <ol className="border-t border-white/10">
            {pieces.items.map((item, index) => {
              const expanded = open === index;
              const panelId = `${baseId}-panel-${index}`;
              return (
                <li key={item.name} className="border-b border-white/10">
                  <h3>
                    <button
                      id={`${panelId}-trigger`}
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      onClick={() => setOpen(expanded ? -1 : index)}
                      className="piece-row group grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-7 text-left sm:grid-cols-[3rem_1fr_auto] sm:gap-6"
                    >
                      <Piece kind={item.kind} className={cn("h-9 w-auto transition-colors duration-300", expanded ? "text-primary" : "text-foreground/35")} />
                      <span className="min-w-0">
                        <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/40">{item.category}</span>
                        <span className="mt-1.5 block font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-none tracking-[-0.05em]">
                          {item.name}
                        </span>
                      </span>
                      <span className="grid size-10 place-items-center rounded-full border border-white/15 transition-colors duration-300 group-hover:border-white/40">
                        <Plus className={cn("piece-plus size-4", expanded && "rotate-45")} />
                      </span>
                    </button>
                  </h3>
                  <div id={panelId} role="region" aria-labelledby={`${panelId}-trigger`} data-open={expanded || undefined} className="piece-panel grid">
                    <div className="min-h-0 overflow-hidden">
                      <div className="pb-9 sm:pl-[4.5rem]">
                        <p className="max-w-[52ch] text-base leading-7 text-foreground/65">{item.body}</p>
                        <ul className="mt-6 flex flex-wrap gap-2">
                          {item.deliverables.map((deliverable) => (
                            <li key={deliverable} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-foreground/70">{deliverable}</li>
                          ))}
                        </ul>
                        <Link
                          href="#diagnostico"
                          tabIndex={expanded ? 0 : -1}
                          className="saga-press mt-7 inline-flex h-10 items-center gap-2 rounded-full bg-primary pl-5 pr-4 text-sm text-primary-foreground hover:bg-[#ff6512]"
                        >
                          Solicitar diagnóstico <ArrowUpRight className="arrow-nudge size-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
