import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { SplitLines } from "@/components/motion/split-lines";
import { Button } from "@/components/ui/button";

export function MainCta() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="orange-gradient relative overflow-hidden rounded-3xl p-8 text-primary-foreground sm:p-12 lg:p-16">
          <div className="noise absolute inset-0" />
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <SplitLines as="h2" className="max-w-4xl font-display text-4xl tracking-[-0.05em] text-black sm:text-5xl">
                Quer transformar seus investimentos em vendas reais?
              </SplitLines>
              <p className="mt-6 max-w-2xl text-sm leading-6 text-black/70 sm:text-base">
                Se você já investe em tráfego, mas sente que o problema está na qualidade dos leads, analisamos sua operação para identificar onde estão as oportunidades de melhoria.
              </p>
            </div>
            <Button asChild size="lg" className="h-12 w-fit rounded-xl bg-black px-5 text-white hover:bg-black/80">
              <Link href="/contato">Quero falar com a Convext <ArrowUpRight /></Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
