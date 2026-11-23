"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(useGSAP);

/**
 * Brilho laranja do hero. Em mouse/trackpad, o foco principal segue o cursor
 * devagar (efeito de profundidade); em touch fica estático.
 */
export function HeroGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const element = ref.current;
    if (!element || !hasFinePointer() || prefersReducedMotion()) return;

    const state = { x: 18, y: 18 };
    const apply = () => {
      element.style.setProperty("--gx", `${state.x}%`);
      element.style.setProperty("--gy", `${state.y}%`);
    };
    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      if (event.clientY > rect.bottom) return;
      gsap.to(state, {
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100,
        duration: 1.6,
        ease: "expo.out",
        overwrite: true,
        onUpdate: apply,
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, { scope: ref });

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(circle at var(--gx, 18%) var(--gy, 18%), rgba(243,87,3,.18), transparent 34%), radial-gradient(circle at 88% 72%, rgba(243,87,3,.1), transparent 32%)",
      }}
    >
      <div className="noise absolute inset-0" />
    </div>
  );
}
