"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/lib/site";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, ScrambleTextPlugin);

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;

    const heading = section.querySelector(".services-heading");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const steps = gsap.utils.toArray<HTMLElement>(".service-step");
    const titles = gsap.utils.toArray<HTMLElement>(".service-step-title");
    let headingSplit: SplitText | undefined;

    if (heading && !reduced) {
      headingSplit = SplitText.create(heading, {
        type: "words",
        mask: "lines",
        autoSplit: true,
        aria: "auto",
        onSplit(self) {
          return gsap.from(self.words, {
            yPercent: 110,
            duration: 0.95,
            ease: "expo.out",
            stagger: 0.045,
            scrollTrigger: { trigger: heading, start: "top 86%" },
          });
        },
      });
    }

    if (reduced || !steps.length) {
      return () => headingSplit?.revert();
    }

    const scramble = (index: number) => {
      const title = titles[index];
      if (!title) return;
      gsap.to(title, {
        duration: 0.6,
        scrambleText: { text: title.dataset.title || "", chars: "upperCase" },
      });
    };

    const media = gsap.matchMedia();
    media.add("(min-width: 1024px)", () => {
      gsap.set(steps, { opacity: 0.28, yPercent: 8 });
      gsap.set(steps[0], { opacity: 1, yPercent: 0 });

      let lastIndex = 0;
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${steps.length * 75}%`,
          pin: true,
          scrub: 0.65,
          anticipatePin: 1,
          onUpdate: (self) => {
            const index = Math.min(steps.length - 1, Math.round(self.progress * (steps.length - 1)));
            if (index === lastIndex) return;
            lastIndex = index;
            scramble(index);
          },
        },
      });

      steps.forEach((step, index) => {
        if (index === 0) return;
        timeline
          .to(steps[index - 1], { opacity: 0.28, yPercent: -8, duration: 0.42, ease: "power3.inOut" })
          .fromTo(step, { opacity: 0.28, yPercent: 10 }, { opacity: 1, yPercent: 0, duration: 0.5, ease: "power3.out" }, "<");
      });

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    });

    media.add("(max-width: 1023px)", () => {
      gsap.from(steps, {
        opacity: 0,
        y: 36,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 78%" },
      });
    });

    return () => {
      headingSplit?.revert();
      media.revert();
    };
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="servicos" className="relative min-h-screen overflow-hidden py-20 sm:py-28 lg:py-0">
      <Container className="flex min-h-screen flex-col justify-center lg:py-24">
        <div className="mb-12 max-w-5xl">
          <p className="label">Serviços oferecidos</p>
          <h2 className="services-heading mt-4 font-display text-h2">
            Como transformamos mídia em vendas
          </h2>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {siteConfig.services.map((service) => (
            <article key={service.number} className="service-step group relative overflow-hidden hover:opacity-100!">
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left scale-x-0 bg-primary transition-transform duration-700 ease-expo group-hover:scale-x-100"
              />
              <div className="relative grid gap-4 py-7 transition-[padding] duration-700 ease-expo md:grid-cols-[0.18fr_0.82fr_1.2fr] md:items-start md:gap-8 md:group-hover:px-6">
                <span className="relative block h-5 overflow-hidden font-mono text-sm text-primary transition-colors duration-300 group-hover:text-black">
                  <span className="block transition-transform duration-500 ease-expo group-hover:-translate-y-full">{service.number}</span>
                  <ArrowUpRight aria-hidden="true" className="absolute left-0 top-full size-5 transition-transform duration-500 ease-expo group-hover:-translate-y-full" />
                </span>
                <h3 data-title={service.title} className="service-step-title font-display text-3xl leading-none tracking-[-0.05em] text-foreground transition-colors duration-300 group-hover:text-black sm:text-4xl">
                  {service.title}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground transition-colors duration-300 group-hover:text-black/75 sm:text-base sm:leading-7">{service.description}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
