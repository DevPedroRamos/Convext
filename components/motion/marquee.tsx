"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const items = ["Branding", "Social Media", "Performance", "Web", "Strategy", "Content"];

export function Marquee() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.to(".marquee-track", {
      xPercent: -50,
      duration: 22,
      ease: "none",
      repeat: -1,
    });
  }, { scope: ref });

  const sequence = [...items, ...items];

  return (
    <div ref={ref} className="overflow-hidden border-y border-border py-5">
      <div className="marquee-track flex w-max gap-10">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex gap-10 pr-10" aria-hidden={copy === 1}>
            {sequence.map((item, index) => (
              <span key={`${copy}-${item}-${index}`} className="font-display text-4xl tracking-[-.06em] text-foreground/80 sm:text-6xl">
                {item} <span className="text-primary">/</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
