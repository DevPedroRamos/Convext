"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

let instance: Lenis | null = null;

/** Instância ativa do Lenis (null quando desligado, ex.: prefers-reduced-motion). */
export function getLenis() {
  return instance;
}

const HEADER_OFFSET = -96;

/** Rola até um elemento/hash usando o Lenis quando ativo, com fallback nativo. */
export function scrollToTarget(target: string | HTMLElement | number, options: { immediate?: boolean } = {}) {
  if (instance) {
    instance.scrollTo(target, { offset: typeof target === "number" ? 0 : HEADER_OFFSET, immediate: options.immediate, duration: 1.2 });
    return;
  }
  if (typeof target === "number") {
    window.scrollTo({ top: target });
    return;
  }
  const element = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (!element) return;
  window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY + HEADER_OFFSET });
}

/**
 * Scroll suave (Lenis) sincronizado com o ScrollTrigger pelo ticker do GSAP.
 * Montado só no layout institucional; o dashboard mantém o scroll nativo.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, autoRaf: false });
    instance = lenis;

    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // Fontes mudam a altura dos títulos: recalcula pins e gatilhos quando carregarem.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      instance = null;
    };
  }, []);

  return null;
}
