import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { FadeUp } from "@/components/motion/fade-up";
import { SplitLines } from "@/components/motion/split-lines";

export function Philosophy() {
  return (
    <Section className="overflow-hidden bg-background">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <p className="label text-primary">Além do CPL</p>
            <SplitLines as="h2" className="mt-4 max-w-4xl font-display text-h2">
              Não queremos apenas diminuir seu CPL. Queremos melhorar o que acontece depois que o lead chega.
            </SplitLines>
          </div>
          <div className="space-y-4 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            <FadeUp>
              <p>Um lead de R$ 5 pode ser caro se nunca responder.</p>
            </FadeUp>
            <FadeUp delay={0.04}>
              <p>Um lead de R$ 15 pode ser barato se tiver perfil, interesse e potencial de compra.</p>
            </FadeUp>
            <FadeUp delay={0.08}>
              <p>Por isso, não tomamos decisões olhando apenas para o custo do lead.</p>
            </FadeUp>
          </div>
        </div>

        <div className="mt-14 rounded-3xl border border-primary/30 bg-primary p-8 text-black sm:p-12 lg:p-16">
          <p className="label text-black/50">Trabalhamos para encontrar o equilíbrio entre</p>
          <p className="mt-6 font-display text-[clamp(3.5rem,11vw,11rem)] leading-[0.82] tracking-[-0.09em]">
            Volume + custo + qualidade
          </p>
          <p className="mt-8 max-w-3xl text-base leading-7 text-black/70 sm:text-lg">
            Porque no mercado imobiliário, o verdadeiro resultado da mídia não está no formulário preenchido. Está na oportunidade de venda que vem depois.
          </p>
        </div>
      </Container>
    </Section>
  );
}
