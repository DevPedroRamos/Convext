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
              <p className="label text-black/50">CTA</p>
              <SplitLines as="h2" className="mt-5 max-w-4xl font-display text-h2 text-black">Tem uma ideia? Vamos transformar em algo grande.</SplitLines>
            </div>
            <Button asChild size="lg" className="h-12 w-fit rounded-xl bg-black px-5 text-white hover:bg-black/80">
              <Link href="/contato">Fale com a Convext <ArrowUpRight /></Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
