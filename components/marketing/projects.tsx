"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SplitLines } from "@/components/motion/split-lines";
import { siteConfig } from "@/lib/site";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Projects() {
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
  }, { scope: ref });

  return (
    <Section id="cases" className="pt-0">
      <div ref={ref}>
      <Container>
        <div className="mb-12 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="label text-primary">Cases</p>
            <SplitLines as="h2" className="mt-4 font-display text-h2">Trabalhos que movem marcas.</SplitLines>
          </div>
          <p className="max-w-xl text-foreground/60 lg:self-end">Uma seleção inicial para representar o tipo de presença que a Convext constrói: visual, estratégica e mensurável.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {siteConfig.projects.map((project) => (
            <article key={project.title} className="group overflow-hidden rounded-3xl border border-border bg-card">
              <div className="case-frame relative aspect-[4/5] overflow-hidden">
                <Image src={project.image} alt={project.title} fill className="object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <div>
                    <p className="text-sm text-white/55">{project.category}</p>
                    <h3 className="mt-2 text-3xl tracking-[-.05em] text-white">{project.title}</h3>
                  </div>
                  <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground transition group-hover:-translate-y-1 group-hover:translate-x-1"><ArrowUpRight /></span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
      </div>
    </Section>
  );
}
