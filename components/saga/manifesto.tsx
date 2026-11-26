"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { manifesto } from "@/lib/saga-content";
import { siteReducedMotion } from "@/lib/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Manifesto fixo na tela enquanto a leitura avança: cada palavra acende no
 * ritmo do scroll. É a única seção "pinada" além do método — e aqui o
 * movimento é o próprio ritmo de leitura, não decoração.
 */
export function Manifesto() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = siteReducedMotion();

    const words = gsap.utils.toArray<HTMLElement>(".mf-word", root);
    const pills = gsap.utils.toArray<HTMLElement>(".mf-pill", root);
    gsap.set(words, { color: "rgba(252,252,252,0.14)" });
    gsap.set(pills, reduce ? { autoAlpha: 0 } : { autoAlpha: 0, scale: 0.92, y: 8 });

    const media = gsap.matchMedia();
    media.add({ desktop: "(min-width: 1024px)", mobile: "(max-width: 1023px)" }, (context) => {
      const desktop = context.conditions?.desktop;
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        // Modo reduzido: a leitura acompanha o scroll sem prender a tela.
        scrollTrigger: reduce
          ? { trigger: root, start: "top 75%", end: "bottom 60%", scrub: 0.6 }
          : {
          trigger: root,
          start: "top top",
          end: desktop ? "+=170%" : "+=130%",
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      const span = 0.85;
      words.forEach((word, index) => {
        const at = (index / words.length) * span;
        timeline.to(word, { color: word.dataset.key ? "#f35703" : "#fcfcfc", duration: 0.06 }, at);
        const pill = word.querySelector(".mf-pill");
        if (pill) timeline.to(pill, reduce ? { autoAlpha: 1, duration: 0.05 } : { autoAlpha: 1, scale: 1, y: 0, duration: 0.05, ease: "power2.out" }, at + 0.02);
      });
      // Respiro no fim: a frase completa fica um instante antes de soltar.
      timeline.to({}, { duration: 1 - span });
    });

    return () => media.revert();
  }, { scope: rootRef });

  return (
    <section ref={rootRef} className="relative flex min-h-svh items-center overflow-hidden bg-ink py-24">
      <div className="container-convext">
        <p className="saga-eyebrow text-foreground/55">{manifesto.eyebrow}</p>
        <p className="mt-10 max-w-[22ch] font-display text-[clamp(2.25rem,5.2vw,5.25rem)] leading-[1.02] tracking-[-0.05em] text-foreground">
          {manifesto.words.map((word, index) => (
            <span key={index}>
              <span data-key={word.pill ? "1" : undefined} className={`mf-word relative inline-block ${word.pill ? "text-primary" : ""}`}>
                {word.text}
                {word.pill ? (
                  <span
                    aria-hidden="true"
                    className="mf-pill absolute -right-[0.5em] -top-[0.4em] rotate-[6deg] whitespace-nowrap rounded-full bg-bone px-2.5 py-1 font-mono text-[11px] leading-none tracking-[0.04em] text-ink"
                  >
                    {word.pill}
                  </span>
                ) : null}
              </span>{" "}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
