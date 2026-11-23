"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

type CursorState = "default" | "link" | "label";

/**
 * Cursor seguidor do site: ponto laranja que cresce sobre links e mostra um
 * rótulo sobre áreas com data-cursor="Texto". O cursor nativo continua visível,
 * exceto nas áreas com data-cursor. Desligado em touch e com reduced-motion.
 */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CursorState>("default");
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !hasFinePointer() || prefersReducedMotion()) return;

    const xTo = gsap.quickTo(element, "x", { duration: 0.45, ease: "expo.out" });
    const yTo = gsap.quickTo(element, "y", { duration: 0.45, ease: "expo.out" });

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      xTo(event.clientX);
      yTo(event.clientY);
      setVisible(true);

      const target = event.target as Element | null;
      const labelled = target?.closest<HTMLElement>("[data-cursor]");
      if (labelled) {
        setState("label");
        setLabel(labelled.dataset.cursor || "");
        return;
      }
      const interactive = target?.closest("a, button, [role='button'], input, textarea, select, label");
      setState(interactive ? "link" : "default");
    };
    const onLeave = () => setVisible(false);

    document.documentElement.setAttribute("data-custom-cursor", "");
    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.documentElement.removeAttribute("data-custom-cursor");
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className="convext-cursor" data-state={state} data-visible={visible} aria-hidden="true">
      <span className="convext-cursor-label">{label}</span>
    </div>
  );
}
