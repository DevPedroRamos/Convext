"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { Piece } from "@/components/saga/piece";
import { SectionHeading } from "@/components/saga/sections";
import { faq } from "@/lib/saga-content";

/** Perguntas frequentes: um item aberto por vez, mesmo acordeão das soluções. */
export function Faq() {
  const [open, setOpen] = useState(0);
  const baseId = useId();

  return (
    <section id="faq" className="saga-light py-24 sm:py-32" data-header-theme="light">
      <div className="container-convext grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading index="09" eyebrow={faq.eyebrow} tone="light">
            {faq.title}
            <br />
            <em>{faq.accent}</em>
          </SectionHeading>
          <Piece kind="knight" className="mt-14 hidden h-40 w-auto text-ink/[0.07] lg:block" />
        </div>

        <ul className="border-t border-ink/15">
          {faq.items.map((item, index) => {
            const expanded = open === index;
            const panelId = `${baseId}-faq-${index}`;
            return (
              <li key={item.q} className="border-b border-ink/15">
                <h3>
                  <button
                    id={`${panelId}-trigger`}
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => setOpen(expanded ? -1 : index)}
                    className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="font-display text-xl tracking-[-0.04em] sm:text-2xl">{item.q}</span>
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-ink/15 transition-colors duration-300 group-hover:border-ink/40">
                      <Plus className={`piece-plus size-4 ${expanded ? "rotate-45" : ""}`} />
                    </span>
                  </button>
                </h3>
                <div id={panelId} role="region" aria-labelledby={`${panelId}-trigger`} data-open={expanded || undefined} className="piece-panel grid">
                  <div className="min-h-0 overflow-hidden">
                    <p className="max-w-[58ch] pb-7 text-base leading-7 text-ink/65">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
