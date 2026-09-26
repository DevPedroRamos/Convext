"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

type SplitLinesProps = {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  play?: "load" | "scroll";
};

export function SplitLines({ children, className, as: Tag = "div", play = "scroll" }: SplitLinesProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const split = SplitText.create(element, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      aria: "auto",
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 115,
          duration: play === "load" ? 1.15 : 1,
          ease: "expo.out",
          stagger: 0.08,
          delay: play === "load" ? 0.12 : 0,
          scrollTrigger: play === "scroll" ? { trigger: element, start: "top 86%" } : undefined,
        });
      },
    });

    return () => split.revert();
  }, { scope: ref });

  return <Tag ref={ref} className={cn(className)}>{children}</Tag>;
}
