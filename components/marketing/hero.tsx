import Link from "next/link";
import { ArrowDown, ArrowUpRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      <div className="relative z-10 flex min-h-screen items-end">
        <div className="container-convext pb-12 pt-32 sm:pb-18 lg:pb-24">
          <p className="label mb-5 text-primary">Convext Mídias</p>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <h1 className="max-w-5xl font-display text-display-xl text-foreground">
              <span className="block">Mais leads qualificados.</span>
              <span className="block opacity-80">Mais oportunidades para vender.</span>
            </h1>
            <div className="max-w-xl lg:justify-self-end">
              <p className="text-lg text-foreground/75 sm:text-xl">Seu marketing não precisa gerar mais contatos. Precisa gerar mais pessoas com potencial real de compra.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90">
                  <Link href="/contato">Quero gerar mais leads qualificados <ArrowUpRight /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-white/15 bg-white/5 px-5 text-white hover:bg-white/10">
                  <Link href="#cases"><Play className="fill-current" /> Ver projetos</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-14 flex items-center gap-3 text-xs uppercase tracking-[.16em] text-white/55">
            <ArrowDown className="size-4 text-primary" /> Scroll para explorar
          </div>
        </div>
      </div>
    </section>
  );
}
