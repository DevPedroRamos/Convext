"use client";

import { useEffect } from "react";
import { hasFinePointer } from "@/lib/motion";

/**
 * Atualiza --mx/--my no elemento [data-spotlight] sob o cursor.
 * Montado uma vez por layout; os cards usam a classe .surface-interactive.
 */
export function PointerSpotlight() {
  useEffect(() => {
    if (!hasFinePointer()) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-spotlight]");
      if (!target) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        target.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        target.style.setProperty("--my", `${event.clientY - rect.top}px`);
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
    };
  }, []);

  return null;
}
