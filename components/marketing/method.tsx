import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { FadeUp } from "@/components/motion/fade-up";
import { SplitLines } from "@/components/motion/split-lines";

const steps = [
  {
    number: "01",
    title: "Estratégia",
    description: "Antes de colocar dinheiro na mídia, entendemos o empreendimento, região, público, produto, condições comerciais e objetivo da operação.",
    note: "A campanha começa antes do anúncio.",
  },
  {
    number: "02",
    title: "Mídia paga",
    description: "Estruturamos campanhas para encontrar pessoas com maior potencial de interesse no empreendimento.",
    note: "Acompanhamos a performance e redistribuímos esforços de acordo com o que os dados mostram.",
  },
  {
    number: "03",
    title: "Criativos que geram interesse",
    description: "Não basta mostrar um apartamento bonito.",
    note: "Testamos diferentes ângulos, ofertas, formatos e mensagens para descobrir o que realmente chama a atenção do público.",
  },
  {
    number: "04",
    title: "Análise contínua",
    description: "Campanhas não são configuradas e esquecidas.",
    note: "Analisamos os dados para identificar o que está funcionando, o que está limitando a performance e onde existem oportunidades de melhoria.",
  },
  {
    number: "05",
    title: "Conexão com o comercial",
    description: "O lead não termina na campanha.",
    note: "Buscamos entender o que acontece depois que ele chega: qualidade, perfil, interesse e retorno do time comercial. É essa informação que ajuda a orientar os próximos testes e otimizações.",
  },
];

export function Method() {
  return (
    <Section>
      <Container>
        <div className="mb-12 max-w-5xl">
          <p className="label text-primary">Método</p>
          <SplitLines as="h2" className="mt-4 font-display text-h2">
            Como transformamos mídia em oportunidades de venda
          </SplitLines>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {steps.map((step, index) => (
            <FadeUp key={step.number} delay={index * 0.03} className="grid gap-6 py-8 md:grid-cols-[0.25fr_0.75fr_1fr] md:items-start">
              <span className="font-mono text-sm text-primary">{step.number}</span>
              <h3 className="font-display text-4xl leading-none tracking-[-0.06em] text-foreground">{step.title}</h3>
              <div className="space-y-3 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                <p>{step.description}</p>
                <p className="text-foreground/80">{step.note}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </Container>
    </Section>
  );
}
