"use client";

import { useRef } from "react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, DrawSVGPlugin, ScrollTrigger);

// Linha com laços entre as casas: o caminho não é reto, mas passa por todas.
const PATH =
  "M 5 40 L 120 40 C 170 40 190 8 160 8 C 130 8 150 40 200 40 L 255 40 L 380 40 C 430 40 450 72 420 72 C 390 72 410 40 460 40 L 510 40 L 635 40 C 685 40 705 8 675 8 C 645 8 665 40 715 40 L 765 40 L 995 40";
// Posição (0–1) de cada casa ao longo do traço.
const NODE_AT = [0, 0.3, 0.6, 0.88];

/**
 * Explica a seção: os quatro pilares só viram sistema quando a linha os liga.
 * Desenhada pelo scroll; cada casa acende quando o traço chega nela.
 */
export function ProblemLine() {
  const ref = useRef<SVGSVGElement>(null);

  useGSAP(() => {
    const svg = ref.current;
    const container = svg?.closest("[data-pillars]");
    if (!svg || !container) return;
    const path = svg.querySelector("path")!;
    const nodes = gsap.utils.toArray<HTMLElement>(".pillar-node", container);

    gsap.fromTo(
      path,
      { drawSVG: "0%" },
      {
        drawSVG: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top 78%",
          end: "top 28%",
          scrub: 0.5,
          onUpdate: (self) => nodes.forEach((node, index) => node.toggleAttribute("data-lit", self.progress >= NODE_AT[index])),
        },
      },
    );
  }, { scope: ref });

  return (
    <svg
      ref={ref}
      viewBox="0 0 1000 80"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute -top-[34.5px] left-0 hidden h-20 w-full overflow-visible lg:block"
    >
      <path d={PATH} fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
