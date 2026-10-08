"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { FadeUp } from "@/components/motion/fade-up";
import { SplitLines } from "@/components/motion/split-lines";
import type { CaseRecord } from "@/lib/case-model";

const diagnosis = [
  {
    title: "Desafio",
    body: "Identificar o motivo real de campanhas com queda de performance ou baixa conversão comercial, evitando o erro comum de apenas colocar mais dinheiro ou trocar anúncios sem critérios.",
  },
  {
    title: "Solução Convext",
    body: "Investigamos além da plataforma de tráfego. Em uma de nossas operações, identificamos que a queda na conversão não vinha das peças publicitárias, mas sim da combinação entre a região da campanha e um fluxo financeiro mais restritivo que reduzia o público elegível.",
  },
  {
    title: "Resultado",
    body: "Reposicionamento de oferta e ajuste de público, destravando a geração de oportunidades reais de venda para o time comercial.",
  },
];

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Projects({ cases }: { cases: CaseRecord[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.utils.toArray<HTMLElement>(".case-frame").forEach((frame) => {
      gsap.fromTo(frame, { clipPath: "inset(14% 14% 14% 14%)" }, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: frame, start: "top 86%" },
      });
    });
  }, { scope: ref, dependencies: [cases.length] });

  return (
    <Section id="cases" className="pt-0">
      <div ref={ref}>
        <Container>
          <div className="mb-12 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="label">Cases de sucesso</p>
              <SplitLines as="h2" className="mt-4 font-display text-h2">Como resolvemos problemas complexos de performance</SplitLines>
            </div>
            <p className="max-w-xl text-foreground/60 lg:self-end">Diagnóstico operacional: otimização além do criativo, olhando região, oferta, público e retorno comercial.</p>
          </div>
          {cases.length === 0 ? (
            <p className="surface p-8 text-foreground/60">Novos cases entram aqui assim que forem publicados.</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-3">
              {cases.map((item) => {
                const inner = (
                  <article>
                    <div className="case-frame relative aspect-[4/5] overflow-hidden">
                      <Image src={item.coverUrl || item.logoUrl} alt="" fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(min-width: 1024px) 33vw, 100vw" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0" />
                      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                        <div className="min-w-0">
                          {item.slug && item.logoUrl ? (
                            <Image src={item.logoUrl} alt="" width={180} height={64} className="mb-3 h-10 w-auto max-w-[160px] object-contain" />
                          ) : null}
                          <p className="text-sm text-white/55">{item.segment}</p>
                          <h3 className="mt-2 text-3xl tracking-[-.04em] text-white">{item.name}</h3>
                          {item.summary ? <p className="mt-2 line-clamp-2 text-sm text-white/70">{item.summary}</p> : null}
                        </div>
                        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition group-hover:-translate-y-1 group-hover:translate-x-1"><ArrowUpRight /></span>
                      </div>
                    </div>
                  </article>
                );
                if (!item.slug) {
                  return <div key={item.id} className="group overflow-hidden rounded-3xl border border-border bg-card">{inner}</div>;
                }
                return (
                  <Link key={item.id} href={`/cases/${item.slug}`} className="group overflow-hidden rounded-3xl border border-border bg-card">
                    {inner}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-16 border-t border-border pt-12">
            <p className="label">Estudo de diagnóstico</p>
            <SplitLines as="h3" className="mt-4 max-w-4xl font-display text-4xl tracking-[-0.05em] sm:text-5xl">
              Otimização além do criativo
            </SplitLines>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {diagnosis.map((item, index) => (
                <FadeUp key={item.title} delay={index * 0.06} className="surface p-6 sm:p-8">
                  <p className="font-mono text-sm text-primary">{String(index + 1).padStart(2, "0")}</p>
                  <h4 className="mt-6 font-display text-3xl leading-none tracking-[-0.05em]">{item.title}</h4>
                  <p className="mt-5 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">{item.body}</p>
                </FadeUp>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </Section>
  );
}
