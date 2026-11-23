import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Magnetic } from "@/components/motion/magnetic";
import { SplitLines } from "@/components/motion/split-lines";
import { Button } from "@/components/ui/button";
import { RollLabel } from "@/components/ui/roll-label";

export function MainCta() {
  return (
    <section id="cta-final" className="py-20 sm:py-28">
      <Container>
        <div data-spotlight className="orange-gradient group relative overflow-hidden rounded-3xl p-8 text-primary-foreground sm:p-12 lg:p-16">
          <div className="noise absolute inset-0" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: "radial-gradient(520px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,.22), transparent 60%)" }}
          />
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <SplitLines as="h2" className="max-w-4xl font-display text-4xl tracking-[-0.05em] text-black sm:text-5xl">
                Quer transformar seus investimentos em vendas reais?
              </SplitLines>
              <p className="mt-6 max-w-2xl text-sm leading-6 text-black/70 sm:text-base">
                Se você já investe em tráfego, mas sente que o problema está na qualidade dos leads, analisamos sua operação para identificar onde estão as oportunidades de melhoria.
              </p>
            </div>
            <Magnetic className="w-fit">
              <Button asChild size="lg" className="h-14 w-fit rounded-full bg-black px-7 text-base text-white hover:bg-black hover:shadow-[0_18px_40px_-16px_rgba(0,0,0,0.8)]">
                <Link href="/contato"><RollLabel>Quero falar com a Convext</RollLabel> <ArrowUpRight className="arrow-nudge" /></Link>
              </Button>
            </Magnetic>
          </div>
        </div>
      </Container>
    </section>
  );
}
