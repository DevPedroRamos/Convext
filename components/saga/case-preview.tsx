"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { hasFinePointer, siteReducedMotion } from "@/lib/motion";

gsap.registerPlugin(useGSAP);

/**
 * Capa do case que acompanha o cursor sobre a lista (só mouse). Segue com
 * inércia (quickTo) e inclina levemente na direção do movimento; entra e sai
 * com escala 0.9 + opacidade, nunca do zero.
 */
export function CasePreview({ covers, children }: { covers: Record<string, string>; children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const root = rootRef.current;
    const card = root?.querySelector<HTMLElement>(".cp-card");
    if (!root || !card || !hasFinePointer() || siteReducedMotion()) return;

    const xTo = gsap.quickTo(card, "x", { duration: 0.55, ease: "power3.out" });
    const yTo = gsap.quickTo(card, "y", { duration: 0.55, ease: "power3.out" });
    const rTo = gsap.quickTo(card, "rotation", { duration: 0.7, ease: "power3.out" });
    const images = gsap.utils.toArray<HTMLElement>(".cp-image", card);
    let lastX = 0;
    let shown = false;

    const show = (key: string | undefined) => {
      const has = Boolean(key && covers[key]);
      images.forEach((image) => image.toggleAttribute("data-shown", image.dataset.key === key));
      if (has !== shown) {
        shown = has;
        gsap.to(card, { autoAlpha: has ? 1 : 0, scale: has ? 1 : 0.9, duration: has ? 0.35 : 0.2, ease: "power3.out", overwrite: "auto" });
      }
    };

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const x = event.clientX - rect.left;
      xTo(x);
      yTo(event.clientY - rect.top);
      rTo(gsap.utils.clamp(-8, 8, (event.clientX - lastX) * 0.6));
      lastX = event.clientX;
      const row = (event.target as HTMLElement).closest<HTMLElement>("[data-case-key]");
      show(row?.dataset.caseKey);
    };
    const onLeave = () => show(undefined);

    gsap.set(card, { autoAlpha: 0, scale: 0.9, xPercent: -50, yPercent: -50 });
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, { scope: rootRef, dependencies: [covers] });

  const entries = Object.entries(covers);

  return (
    <div ref={rootRef} className="relative">
      {children}
      {entries.length ? (
        <div aria-hidden="true" className="cp-card pointer-events-none invisible absolute left-0 top-0 z-10 hidden aspect-[4/5] w-60 overflow-hidden rounded-xl shadow-[0_30px_80px_-30px_rgba(0,0,0,.6)] [@media(hover:hover)_and_(pointer:fine)]:block">
          {entries.map(([key, url]) => (
            <Image key={key} data-key={key} src={url} alt="" fill sizes="240px" className="cp-image object-cover" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
