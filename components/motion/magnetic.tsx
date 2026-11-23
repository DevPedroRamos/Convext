"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(useGSAP);

/**
 * Atrai o filho na direção do cursor (efeito magnético). Só em mouse/trackpad
 * e sem prefers-reduced-motion. O wrapper se move, então o filho mantém
 * suas próprias transições (hover, active).
 */
export function Magnetic({ children, strength = 0.35, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const element = ref.current;
    if (!element || !hasFinePointer() || prefersReducedMotion()) return;

    const xTo = gsap.quickTo(element, "x", { duration: 0.6, ease: "expo.out" });
    const yTo = gsap.quickTo(element, "y", { duration: 0.6, ease: "expo.out" });

    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      xTo((event.clientX - (rect.left + rect.width / 2)) * strength);
      yTo((event.clientY - (rect.top + rect.height / 2)) * strength);
    };
    const onLeave = () => {
      gsap.to(element, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)", overwrite: true });
    };

    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerleave", onLeave);
    return () => {
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", onLeave);
    };
  }, { scope: ref });

  return <span ref={ref} className={cn("inline-block will-change-transform", className)}>{children}</span>;
}
