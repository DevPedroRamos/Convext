"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const parts = ["Volume", "+", "custo", "+", "qualidade"];

/** "Volume + custo + qualidade" montado peça por peça conforme o scroll. */
export function EquationReveal() {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    const words = gsap.utils.toArray<HTMLElement>(".equation-word");
    const plus = gsap.utils.toArray<HTMLElement>(".equation-plus");

    const timeline = gsap.timeline({
      scrollTrigger: { trigger: ref.current, start: "top 85%", end: "top 40%", scrub: 0.8 },
    });
    timeline
      .from(words, { yPercent: 110, stagger: 0.25, ease: "expo.out", duration: 1 })
      .from(plus, { scale: 0, rotate: -180, stagger: 0.25, ease: "back.out(2)", duration: 0.8 }, 0.2);
  }, { scope: ref });

  return (
    <p ref={ref} aria-label={parts.join(" ")} className="mt-6 flex flex-wrap items-baseline gap-x-[0.22em] font-display text-[clamp(2.75rem,8vw,8rem)] leading-[0.86] tracking-[-0.08em]">
      {parts.map((part, index) =>
        part === "+" ? (
          <span key={index} aria-hidden="true" className="equation-plus inline-block">+</span>
        ) : (
          <span key={index} aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em]">
            <span className="equation-word inline-block">{part}</span>
          </span>
        ),
      )}
    </p>
  );
}
