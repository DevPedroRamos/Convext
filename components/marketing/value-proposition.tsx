import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { FadeUp } from "@/components/motion/fade-up";
import { SplitLines } from "@/components/motion/split-lines";

export function ValueProposition() {
  return (
    <Section>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="label">A nossa proposta de valor</p>
            <SplitLines as="h2" className="mt-4 max-w-4xl font-display text-h2">
              Seu marketing não precisa gerar mais contatos. Precisa gerar mais pessoas com potencial real de compra.
            </SplitLines>
          </div>
          <div className="space-y-5 text-base leading-7 text-foreground/72 sm:text-lg sm:leading-8">
            <FadeUp>
              <p>
                Você investe em tráfego, recebe leads, mas seu time comercial continua reclamando da qualidade? Leads sem perfil, pessoas que não respondem e contatos sem interesse real geram custo e perda de tempo.
              </p>
            </FadeUp>
            <FadeUp delay={0.06}>
              <p>
                Na Convext, olhamos além do CPL (Custo Por Lead). Não tomamos decisões olhando apenas para o preço do formulário preenchido, mas sim para o equilíbrio ideal entre Volume + Custo + Qualidade. Analisamos campanha, empreendimento, região, oferta, criativo, público e retorno do comercial para gerar mais oportunidades reais de venda.
              </p>
            </FadeUp>
          </div>
        </div>

        <FadeUp delay={0.1} className="mt-14 overflow-hidden rounded-3xl border border-primary/30 bg-primary p-8 text-black sm:p-12 lg:p-16">
          <p className="label">O equilíbrio ideal</p>
          <p className="mt-6 font-display text-[clamp(2.75rem,8vw,8rem)] leading-[0.82] tracking-[-0.08em]">
            Volume + custo + qualidade
          </p>
        </FadeUp>
      </Container>
    </Section>
  );
}
