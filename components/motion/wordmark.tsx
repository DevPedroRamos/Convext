"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export function Wordmark({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const split = SplitText.create(element, {
      type: "chars",
      aria: "auto",
      onSplit(self) {
        return gsap.from(self.chars, {
          yPercent: 80,
          stagger: 0.04,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 92%", end: "top 55%", scrub: 0.6 },
        });
      },
    });

    return () => split.revert();
  }, { scope: ref });

  return <div ref={ref} className={className}>{text}</div>;
}
