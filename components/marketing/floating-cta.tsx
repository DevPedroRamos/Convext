"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { RollLabel } from "@/components/ui/roll-label";
import { cn } from "@/lib/utils";

/**
 * CTA persistente da home: aparece quando o formulário do hero sai da tela e
 * some quando o CTA final ou o rodapé entram, para não duplicar chamadas.
 */
export function FloatingCta() {
  const [formVisible, setFormVisible] = useState(true);
  const [endVisible, setEndVisible] = useState(false);

  useEffect(() => {
    const form = document.getElementById("hero-lead-form");
    const ends = ["cta-final", "site-footer"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const visibleEnds = new Set<Element>();

    const formObserver = new IntersectionObserver(([entry]) => setFormVisible(entry.isIntersecting), { threshold: 0 });
    const endObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? visibleEnds.add(entry.target) : visibleEnds.delete(entry.target)));
      setEndVisible(visibleEnds.size > 0);
    });

    if (form) formObserver.observe(form);
    ends.forEach((element) => endObserver.observe(element));
    return () => {
      formObserver.disconnect();
      endObserver.disconnect();
    };
  }, []);

  const show = !formVisible && !endVisible;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 transition-[transform,opacity] duration-700 ease-expo sm:inset-x-auto sm:right-6 sm:bottom-6",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[calc(100%+2rem)] opacity-0",
      )}
      aria-hidden={!show}
    >
      <Link
        href="/contato"
        tabIndex={show ? 0 : -1}
        className="group flex items-center gap-3 rounded-full border border-white/10 bg-background/80 py-2 pl-4 pr-2 text-sm text-foreground shadow-2xl shadow-black/50 backdrop-blur-xl transition-colors duration-300 hover:border-primary/60"
      >
        <span className="pulse-dot size-2 rounded-full bg-primary" aria-hidden="true" />
        <span className="flex flex-col leading-tight">
          <RollLabel className="font-medium">Falar com a Convext</RollLabel>
          <span className="text-xs text-muted-foreground">Retorno em até 1 dia útil</span>
        </span>
        <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground transition-transform duration-500 ease-expo group-hover:rotate-45">
          <ArrowUpRight className="size-4" />
        </span>
      </Link>
    </div>
  );
}
