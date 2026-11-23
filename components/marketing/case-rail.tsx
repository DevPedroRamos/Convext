"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { hasFinePointer } from "@/lib/motion";

/**
 * Trilho horizontal de cases: scroll nativo com snap (touch), arrastar com o
 * mouse no desktop e setas para teclado/clique.
 */
export function CaseRail({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const rail = ref.current;
    if (!rail) return;

    const update = () => {
      setEdges({ start: rail.scrollLeft <= 4, end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4 });
    };
    update();
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    if (!hasFinePointer()) {
      return () => {
        rail.removeEventListener("scroll", update);
        window.removeEventListener("resize", update);
      };
    }

    let startX = 0;
    let startScroll = 0;
    let dragging = false;
    let moved = false;

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      startScroll = rail.scrollLeft;
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      const delta = event.clientX - startX;
      if (!moved && Math.abs(delta) > 6) {
        moved = true;
        rail.setPointerCapture(event.pointerId);
        rail.style.scrollSnapType = "none";
        rail.style.cursor = "grabbing";
      }
      if (moved) rail.scrollLeft = startScroll - delta;
    };
    const onUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
      rail.style.scrollSnapType = "";
      rail.style.cursor = "";
      if (moved) {
        rail.dataset.dragged = "";
        window.setTimeout(() => delete rail.dataset.dragged, 60);
      }
    };
    // Um arraste não deve abrir o case sob o cursor.
    const onClick = (event: MouseEvent) => {
      if (!moved) return;
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    };

    rail.addEventListener("pointerdown", onDown);
    rail.addEventListener("pointermove", onMove);
    rail.addEventListener("pointerup", onUp);
    rail.addEventListener("pointercancel", onUp);
    rail.addEventListener("click", onClick, true);
    return () => {
      rail.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      rail.removeEventListener("pointerdown", onDown);
      rail.removeEventListener("pointermove", onMove);
      rail.removeEventListener("pointerup", onUp);
      rail.removeEventListener("pointercancel", onUp);
      rail.removeEventListener("click", onClick, true);
    };
  }, []);

  const step = (direction: 1 | -1) => {
    const rail = ref.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div>
      <div
        ref={ref}
        data-cursor="Arrastar"
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={edges.start}
          aria-label="Cases anteriores"
          className="grid size-11 place-items-center rounded-full border border-border text-foreground transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ArrowLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={edges.end}
          aria-label="Próximos cases"
          className="grid size-11 place-items-center rounded-full border border-border text-foreground transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
