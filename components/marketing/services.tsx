import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { FadeUp } from "@/components/motion/fade-up";
import { SplitLines } from "@/components/motion/split-lines";
import { siteConfig } from "@/lib/site";

export function Services() {
  return (
    <Section id="servicos">
      <Container>
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label text-primary">Serviços</p>
            <SplitLines as="h2" className="mt-4 font-display text-h2">O que fazemos.</SplitLines>
          </div>
          <p className="max-w-md text-foreground/60">Da primeira ideia ao produto em produção, criamos presença digital com clareza estratégica.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {siteConfig.services.map((service, index) => (
            <FadeUp key={service.number} delay={index * 0.04} className="group surface min-h-72 p-6 transition duration-300 hover:border-primary hover:bg-secondary">
              <div className="flex items-start justify-between">
                <span className="font-mono text-sm text-muted-foreground transition group-hover:text-primary">{service.number}</span>
                <ArrowUpRight className="text-muted-foreground transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <h3 className="mt-24 text-3xl tracking-[-.04em]">{service.title}</h3>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{service.description}</p>
            </FadeUp>
          ))}
        </div>
      </Container>
    </Section>
  );
}
