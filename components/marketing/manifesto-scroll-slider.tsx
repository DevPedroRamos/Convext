"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Container } from "@/components/layout/container";

const manifestoLines = [
  "A Convext conecta criatividade,",
  "estratégia e tecnologia",
  "para construir marcas",
  "que não passam despercebidas.",
];

gsap.registerPlugin(useGSAP, ScrollTrigger);

function formatCounter(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function ManifestoScrollSlider() {
  const sectionRef = useRef<HTMLElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lines = gsap.utils.toArray<HTMLElement>(".manifesto-slider-line");
    if (!lines.length) return;

    gsap.set(lines, { autoAlpha: 0, yPercent: 86, scale: 0.96 });
    gsap.set(lines[0], { autoAlpha: 1, yPercent: 0, scale: 1 });

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: `+=${manifestoLines.length * 85}%`,
        scrub: 0.65,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const index = Math.min(manifestoLines.length - 1, Math.round(self.progress * (manifestoLines.length - 1)));
          if (counterRef.current) counterRef.current.textContent = formatCounter(index);
        },
      },
    });

    lines.forEach((line, index) => {
      if (index === 0) return;

      timeline
        .to(lines[index - 1], {
          autoAlpha: 0,
          yPercent: -86,
          scale: 0.96,
          duration: 0.48,
          ease: "power3.inOut",
        })
        .fromTo(
          line,
          { autoAlpha: 0, yPercent: 86, scale: 0.96 },
          {
            autoAlpha: 1,
            yPercent: 0,
            scale: 1,
            duration: 0.58,
            ease: "power3.out",
          },
          "<0.18",
        );
    });

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
    };
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="sobre" className="relative min-h-screen overflow-hidden bg-primary text-primary-foreground">
      <Container className="flex min-h-screen flex-col justify-between py-10 sm:py-14 lg:py-16">
        <div className="flex items-center justify-between gap-6">
          <p className="label text-black/50">Manifesto</p>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-black/45">
            <span ref={counterRef}>01</span> / {String(manifestoLines.length).padStart(2, "0")}
          </p>
        </div>

        <div className="relative flex min-h-[62vh] items-center motion-reduce:block motion-reduce:min-h-0 motion-reduce:space-y-5">
          {manifestoLines.map((line) => (
            <div
              key={line}
              className="manifesto-slider-line absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-0 first:opacity-100 motion-reduce:relative motion-reduce:top-auto motion-reduce:translate-y-0 motion-reduce:opacity-100"
            >
              <span className="block max-w-[13ch] font-display text-[clamp(3.75rem,12vw,12rem)] leading-[0.82] tracking-[-0.085em] text-black sm:max-w-none">
                {line}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-6 border-t border-black/15 pt-5 text-xs uppercase tracking-[0.16em] text-black/45">
          <span>Scroll para navegar</span>
          <span>Convext / Manifesto</span>
        </div>
      </Container>
    </section>
  );
}
