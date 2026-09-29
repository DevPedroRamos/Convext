import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { FadeUp } from "@/components/motion/fade-up";
import { SplitLines } from "@/components/motion/split-lines";

const painPoints = [
  "O volume de leads aumenta, mas as vendas não acompanham.",
  "O CPL parece bom, mas o comercial reclama da qualidade.",
  "O corretor perde tempo tentando falar com pessoas sem perfil.",
  "A campanha começa bem e depois perde performance.",
  "Você aumenta a verba, mas não sabe se está aumentando as oportunidades.",
  "Sua agência mostra relatórios, mas não consegue explicar por que os leads não estão convertendo.",
];

export function Problem() {
  return (
    <Section className="bg-secondary/40">
      <Container>
        <div className="mb-12 grid gap-6 lg:grid-cols-[1fr_.8fr] lg:items-end">
          <div>
            <p className="label text-primary">Diagnóstico</p>
            <SplitLines as="h2" className="mt-4 max-w-4xl font-display text-h2">
              Seu problema não é falta de leads. É gastar dinheiro para trazer pessoas que não compram.
            </SplitLines>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">Talvez você já tenha passado por isso:</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {painPoints.map((point, index) => (
            <FadeUp key={point} delay={index * 0.04} className="surface min-h-56 p-6">
              <span className="font-mono text-sm text-primary">{String(index + 1).padStart(2, "0")}</span>
              <p className="mt-16 text-xl leading-7 tracking-[-0.03em] text-foreground">{point}</p>
            </FadeUp>
          ))}
        </div>

        <div className="mt-12 grid gap-6 border-t border-border pt-10 lg:grid-cols-[0.8fr_1.2fr]">
          <p className="font-display text-4xl leading-none tracking-[-0.06em] text-foreground sm:text-6xl">Na Convext, olhamos além do CPL.</p>
          <div className="space-y-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            <p>Isso acontece quando a mídia é analisada apenas pelo número de leads gerados.</p>
            <p>Analisamos campanha, empreendimento, região, oferta, criativo, público e retorno do comercial para entender quais contatos têm maior potencial e quais ajustes podem melhorar a qualidade da geração.</p>
            <p className="text-foreground">O objetivo é simples: gerar mais oportunidades para o seu time vender.</p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
