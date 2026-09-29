import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { FadeUp } from "@/components/motion/fade-up";
import { SplitLines } from "@/components/motion/split-lines";
import { Button } from "@/components/ui/button";

export function Positioning() {
  return (
    <Section className="bg-background">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="sticky top-24">
            <p className="label text-primary">Performance imobiliária</p>
            <SplitLines as="h2" className="mt-4 max-w-3xl font-display text-h2">
              Seu marketing não precisa gerar mais contatos. Precisa gerar mais pessoas com potencial real de compra.
            </SplitLines>
          </div>

          <div className="space-y-5 text-lg leading-8 text-foreground/72 sm:text-xl sm:leading-9">
            <FadeUp>
              <p>Você investe em tráfego, recebe leads, mas seu time comercial continua reclamando da qualidade?</p>
            </FadeUp>
            <FadeUp delay={0.04}>
              <p>Leads sem perfil. Pessoas que não respondem. Contatos que não têm interesse real.</p>
            </FadeUp>
            <FadeUp delay={0.08}>
              <p>No fim, o problema não é apenas o custo por lead.</p>
            </FadeUp>
            <FadeUp delay={0.12}>
              <p>É quanto você está investindo para gerar oportunidades que realmente podem se transformar em vendas.</p>
            </FadeUp>
            <FadeUp delay={0.16}>
              <p>A Convext Mídias transforma mídia paga em uma operação de geração de leads mais qualificados para o mercado imobiliário, conectando estratégia, anúncios, criativos, dados e comercial.</p>
            </FadeUp>
            <FadeUp delay={0.2} className="rounded-3xl border border-primary/30 bg-primary/10 p-6 text-foreground">
              <p className="font-display text-3xl leading-none tracking-[-0.05em] sm:text-5xl">Porque gerar lead é fácil. Gerar lead que pode virar venda é o que importa.</p>
              <Button asChild size="lg" className="mt-8 h-12 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90">
                <Link href="/contato">Quero gerar mais leads qualificados <ArrowUpRight /></Link>
              </Button>
            </FadeUp>
          </div>
        </div>
      </Container>
    </Section>
  );
}
