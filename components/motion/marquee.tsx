"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const items = ["Leads qualificados", "Mídia paga", "Criativos de performance", "Lançamentos", "VGV", "Dados + comercial"];

/**
 * Faixa contínua que reage ao scroll: acelera com a velocidade e inverte o
 * sentido quando a pessoa rola para cima.
 */
export function Marquee() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;

    const loop = gsap.to(".marquee-track", { xPercent: -50, duration: 32, ease: "none", repeat: -1 });
    // Começa "adiantado" para que o sentido reverso tenha espaço para rodar.
    loop.totalTime(loop.duration() * 100);

    let direction = 1;
    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: "top bottom",
      end: "bottom top",
      onUpdate(self) {
        direction = self.direction;
        const boost = Math.min(Math.abs(self.getVelocity()) / 250, 5);
        gsap.to(loop, {
          timeScale: direction * (1 + boost),
          duration: 0.2,
          ease: "power1.out",
          overwrite: true,
          onComplete: () => {
            gsap.to(loop, { timeScale: direction, duration: 1.2, ease: "power2.out", overwrite: true });
          },
        });
      },
    });

    gsap.to(".marquee-separator", { rotate: 360, duration: 6, ease: "none", repeat: -1 });

    return () => trigger.kill();
  }, { scope: ref });

  const sequence = [...items, ...items];

  return (
    <div ref={ref} className="overflow-hidden border-y border-border py-5" aria-label={items.join(", ")}>
      <div className="marquee-track flex w-max gap-10" aria-hidden="true">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-10 pr-10">
            {sequence.map((item, index) => (
              <span key={`${copy}-${item}-${index}`} className="flex items-center gap-10 font-display text-4xl tracking-[-.06em] text-foreground/80 sm:text-6xl">
                {item}
                <span className="marquee-separator inline-block text-primary">✳</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
