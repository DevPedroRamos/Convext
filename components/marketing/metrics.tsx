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
    gsap.utils.toArray<HTMLElement>("[data-count]").forEach((node) => {
      const target = Number(node.dataset.count || 0);
      const counter = { value: 0 };
      gsap.to(counter, {
        value: target,
        duration: 1.8,
        ease: "power3.out",
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
            <p className="label text-primary">Resultados</p>
            <SplitLines as="h2" className="mt-4 max-w-4xl font-display text-h2">
              Mais de R$ 1 bilhão em VGV impactado.
            </SplitLines>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground lg:justify-self-end">
            A Convext atua exclusivamente com o mercado imobiliário, ajudando corretores, imobiliárias, construtoras e incorporadoras a transformar investimento em mídia em novas oportunidades comerciais. Atuação em São Paulo e Rio de Janeiro.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {siteConfig.metrics.map((metric) => (
            <div key={metric.label} className="surface min-h-48 p-6">
              <div className="font-display text-6xl tracking-[-.07em]">
                {metric.prefix}<span data-count={metric.value}>0</span>{metric.suffix}
              </div>
              <p className="mt-10 text-sm text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
