"use client";

import { useId, useRef } from "react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { competencies } from "@/lib/saga-content";
import { siteReducedMotion } from "@/lib/motion";

gsap.registerPlugin(useGSAP, DrawSVGPlugin, ScrollTrigger);

/**
 * Faixa de competências correndo sobre uma curva, como o caminho de uma
 * peça pelo tabuleiro. A faixa se desenha uma vez quando entra na tela;
 * depois o texto corre em velocidade constante (linear).
 */
const PATH = "M -80 150 C 220 40, 420 40, 640 120 S 1080 230, 1520 70";
const unit = competencies.map((item) => `${item.toUpperCase()}  ✦  `).join("");

export function PathMarquee() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathId = useId().replace(/:/g, "");

  useGSAP(() => {
    const root = rootRef.current;
    if (!root) return;
    const band = root.querySelector<SVGPathElement>(".pm-band");
    const textPath = root.querySelector<SVGTextPathElement>(".pm-text");
    const measure = root.querySelector<SVGTSpanElement>(".pm-unit");
    if (!band || !textPath || !measure) return;

    const reduce = siteReducedMotion();
    const unitLength = measure.getComputedTextLength() || 1400;
    // ~70px/s: ritmo de leitura, não de vitrine.
    // Movimento contínuo sai no modo reduzido; o desenho de entrada fica (não desloca nada).
    const loop = reduce
      ? null
      : gsap.fromTo(textPath, { attr: { startOffset: 0 } }, { attr: { startOffset: -unitLength }, duration: unitLength / 70, ease: "none", repeat: -1 });

    // Entrada única: a faixa se desenha e o texto aparece logo atrás dela.
    const intro = gsap.timeline({ scrollTrigger: { trigger: root, start: "top 92%", once: true } });
    intro
      .fromTo(band, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 1.2, ease: "expo.out" })
      .fromTo(root.querySelector(".pm-text-group"), { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "none" }, 0.35);

    // Só anda enquanto está visível.
    const visibility = ScrollTrigger.create({
      trigger: root,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (self.isActive ? loop?.play() : loop?.pause()),
    });

    return () => {
      loop?.kill();
      visibility.kill();
    };
  }, { scope: rootRef });

  return (
    <div ref={rootRef} className="pointer-events-none relative z-20 -mt-24 h-[180px] overflow-hidden bg-[linear-gradient(to_bottom,transparent_96px,var(--ink)_96px)] sm:-mt-28 sm:h-[230px] sm:bg-[linear-gradient(to_bottom,transparent_112px,var(--ink)_112px)]" aria-label={competencies.join(", ")} role="img">
      <svg viewBox="0 0 1440 230" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <path id={pathId} d={PATH} />
        </defs>
        <path className="pm-band" d={PATH} fill="none" stroke="var(--primary)" strokeWidth="58" strokeLinecap="round" />
        <g className="pm-text-group">
          <text dy="9" className="fill-ink font-display text-[26px] uppercase" style={{ letterSpacing: "-0.02em" }}>
            <textPath className="pm-text" href={`#${pathId}`} startOffset="0">
              <tspan className="pm-unit">{unit}</tspan>
              <tspan>{unit}</tspan>
              <tspan>{unit}</tspan>
            </textPath>
          </text>
        </g>
      </svg>
    </div>
  );
}
