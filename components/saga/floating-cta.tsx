"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Atalho persistente para o diagnóstico: aparece depois do hero e some quando
 * o formulário ou o rodapé já estão na tela, para não duplicar a chamada.
 */
export function FloatingCta() {
  const [heroVisible, setHeroVisible] = useState(true);
  const [endVisible, setEndVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("inicio");
    const ends = ["diagnostico", "site-footer"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const visibleEnds = new Set<Element>();
    const heroObserver = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), { rootMargin: "0px 0px -40% 0px" });
    const endObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? visibleEnds.add(entry.target) : visibleEnds.delete(entry.target)));
      setEndVisible(visibleEnds.size > 0);
    });
    if (hero) heroObserver.observe(hero);
    ends.forEach((element) => endObserver.observe(element));
    return () => {
      heroObserver.disconnect();
      endObserver.disconnect();
    };
  }, []);

  const show = !heroVisible && !endVisible;

  return (
    <div
      className={cn(
        "floating-cta fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6",
        show ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
      aria-hidden={!show}
    >
      <Link
        href="#diagnostico"
        tabIndex={show ? 0 : -1}
        className="saga-press flex h-12 items-center gap-2 rounded-full bg-primary pl-5 pr-4 text-sm text-primary-foreground shadow-[0_16px_40px_-12px_rgba(243,87,3,.6)] hover:bg-[#ff6512]"
      >
        Solicitar diagnóstico <ArrowUpRight className="arrow-nudge size-4" />
      </Link>
    </div>
  );
}
