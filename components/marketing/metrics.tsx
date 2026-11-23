"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Container } from "@/components/layout/container";
import { SplitLines } from "@/components/motion/split-lines";
import { siteConfig } from "@/lib/site";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Metrics() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from(".metric-card", {
      opacity: 0,
      y: 42,
      duration: 0.9,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 80%" },
    });
    gsap.from(".metric-bar", {
      scaleX: 0,
      duration: 1.6,
      stagger: 0.1,
      ease: "expo.out",
      scrollTrigger: { trigger: ref.current, start: "top 75%" },
    });
    gsap.utils.toArray<HTMLElement>("[data-count]").forEach((node) => {
      const target = Number(node.dataset.count || 0);
      const counter = { value: 0 };
      node.textContent = "0";
      gsap.to(counter, {
        value: target,
        duration: 2,
        ease: "expo.out",
        scrollTrigger: { trigger: node, start: "top 85%" },
        onUpdate: () => { node.textContent = Math.round(counter.value).toString(); },
      });
    });
  }, { scope: ref });

  return (
    <section ref={ref} className="py-20 sm:py-28">
      <Container>
        <div className="mb-12 grid gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div>
            <p className="label">Resultados</p>
            <SplitLines as="h2" className="mt-4 max-w-4xl font-display text-h2">
              Performance comprovada no mercado imobiliário
            </SplitLines>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground lg:justify-self-end">
            A Convext atua exclusivamente com o segmento imobiliário, ajudando construtoras, incorporadoras, imobiliárias e corretores a transformar investimento em mídia em vendas reais. Presença consolidada em São Paulo e Rio de Janeiro.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {siteConfig.metrics.map((metric) => (
            <div key={metric.label} className="metric-card">
              <div data-spotlight className="surface surface-interactive h-full min-h-48 overflow-hidden p-6">
                <div className="font-display text-6xl tracking-[-.07em]">
                  {metric.prefix}<span data-count={metric.value}>{metric.value}</span>{metric.suffix}
                </div>
                <p className="mt-10 text-sm text-muted-foreground">{metric.label}</p>
                <span aria-hidden="true" className="metric-bar absolute inset-x-6 bottom-0 h-px origin-left bg-primary" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
