"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";
import { scrollToTarget } from "@/components/motion/smooth-scroll";

gsap.registerPlugin(ScrollTrigger);

const MARKETING_ROUTES = [/^\/$/, /^\/contato(\/|$)/, /^\/cases(\/|$)/, /^\/design-system(\/|$)/];

function isMarketingRoute(pathname: string) {
  return MARKETING_ROUTES.some((pattern) => pattern.test(pathname));
}

/**
 * Transição entre páginas do site: uma cortina laranja sobe, a rota troca por
 * baixo e a cortina sai por cima. Links para a mesma página com hash rolam
 * suavemente até a seção. Rotas fora do site (dashboard, auth) navegam direto.
 */
export function RouteCurtain() {
  const router = useRouter();
  const pathname = usePathname();
  const curtainRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const pendingHash = useRef<string | null>(null);
  const covering = useRef(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.hasAttribute("download") || anchor.dataset.noTransition !== undefined) return;
      // Soltar um arraste (ex.: trilho de cases) não é um clique de navegação.
      if (anchor.closest("[data-dragged]")) return;
      if (anchor.target && anchor.target !== "_self") return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      if (url.pathname === window.location.pathname) {
        event.preventDefault();
        if (url.hash) {
          scrollToTarget(url.hash);
          window.history.replaceState(null, "", url.hash);
        } else {
          scrollToTarget(0);
        }
        return;
      }

      if (!isMarketingRoute(url.pathname) || prefersReducedMotion() || covering.current) return;

      event.preventDefault();
      covering.current = true;
      pendingHash.current = url.hash || null;
      const href = `${url.pathname}${url.search}${url.hash}`;
      router.prefetch(url.pathname);

      gsap.timeline({ onComplete: () => router.push(href, { scroll: false }) })
        .set(curtainRef.current, { transformOrigin: "bottom", pointerEvents: "auto" })
        .to(curtainRef.current, { scaleY: 1, duration: 0.6, ease: "power4.inOut" })
        .fromTo(wordRef.current, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, "-=0.25");
    };

    // Captura: roda antes do onClick do next/link, que respeita defaultPrevented.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  useEffect(() => {
    if (!covering.current) return;

    const hash = pendingHash.current;
    pendingHash.current = null;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        // A página nova montou atrás da cortina: recalcula gatilhos antes de revelar.
        ScrollTrigger.refresh();
        if (hash) scrollToTarget(hash, { immediate: true });
        else scrollToTarget(0, { immediate: true });

        gsap.timeline({ onComplete: () => { covering.current = false; } })
          .to(wordRef.current, { yPercent: -100, opacity: 0, duration: 0.35, ease: "power3.in" })
          .set(curtainRef.current, { transformOrigin: "top" })
          .to(curtainRef.current, { scaleY: 0, duration: 0.7, ease: "power4.inOut" }, "-=0.1")
          .set(curtainRef.current, { pointerEvents: "none" });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div ref={curtainRef} className="route-curtain" aria-hidden="true">
      <span className="block overflow-hidden">
        <span ref={wordRef} className="block font-display text-[clamp(3rem,10vw,9rem)] leading-none tracking-[-0.08em] opacity-0">
          Convext
        </span>
      </span>
    </div>
  );
}
