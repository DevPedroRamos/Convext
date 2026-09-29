import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { FadeUp } from "@/components/motion/fade-up";
import { SplitLines } from "@/components/motion/split-lines";

const differentials = [
  {
    title: "Somos especialistas em mercado imobiliário.",
    body: [
      "O mercado imobiliário não funciona como qualquer outro segmento.",
      "Produto, localização, renda, entrada, parcela, público e momento de compra podem mudar completamente o comportamento de uma campanha.",
      "Por isso, não aplicamos uma fórmula genérica. Construímos a estratégia de acordo com a realidade de cada empreendimento.",
    ],
  },
  {
    title: "Não otimizamos campanha. Otimizamos oportunidades.",
    body: [
      "Uma campanha pode ter um CPL excelente e ainda assim gerar poucos resultados comerciais.",
      "Por isso, nosso olhar vai além da plataforma de anúncios.",
      "O que importa é entender quais campanhas, públicos, criativos e ofertas estão trazendo as melhores oportunidades para o negócio.",
    ],
  },
  {
    title: "Criativos pensados para vender.",
    body: [
      "O criativo não serve apenas para chamar atenção.",
      "Ele precisa ajudar o potencial comprador a entender por que aquele empreendimento merece a atenção dele.",
      "Por isso, testamos diferentes formas de apresentar produto, região, condições e diferenciais.",
    ],
  },
  {
    title: "Mídia e comercial precisam falar a mesma língua.",
    body: [
      "O marketing gera o contato. O comercial transforma esse contato em oportunidade.",
      "Quando essas duas áreas trabalham desconectadas, você pode continuar investindo dinheiro em leads que não têm qualidade.",
      "Por isso, usamos o retorno do comercial como parte importante da leitura da operação.",
    ],
  },
];

const bottlenecks = [
  "Pode ser a região.",
  "Pode ser o público.",
  "Pode ser a condição financeira.",
  "Pode ser a oferta.",
  "Pode ser o criativo.",
  "Pode ser a comunicação.",
  "Pode ser a própria abordagem comercial.",
];

export function Differentials() {
  return (
    <Section className="bg-secondary/40">
      <Container>
        <div className="mb-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="label text-primary">Diferenciais</p>
            <SplitLines as="h2" className="mt-4 font-display text-h2">
              O que fazemos diferente?
            </SplitLines>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground lg:justify-self-end">
            A Convext conecta mídia, criativos, dados e retorno comercial para entender onde estão as oportunidades reais de venda.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {differentials.map((item, index) => (
            <FadeUp key={item.title} delay={index * 0.04} className="surface p-6 sm:p-8">
              <h3 className="font-display text-4xl leading-none tracking-[-0.06em] text-foreground">{item.title}</h3>
              <div className="mt-8 space-y-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                {item.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </FadeUp>
          ))}
        </div>

        <div className="mt-4 rounded-3xl border border-primary/30 bg-background p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="label text-primary">Quando a campanha não funciona</p>
              <h3 className="mt-4 font-display text-5xl leading-none tracking-[-0.07em] text-foreground">Não colocamos simplesmente mais dinheiro. Investigamos o motivo.</h3>
            </div>
            <div>
              <div className="grid gap-2 sm:grid-cols-2">
                {bottlenecks.map((item) => (
                  <p key={item} className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground/75">{item}</p>
                ))}
              </div>
              <p className="mt-6 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                Nosso trabalho é encontrar o gargalo e testar novas possibilidades. Foi assim que identificamos, por exemplo, que uma campanha poderia estar sendo impactada não necessariamente pelos criativos, mas pela combinação entre região e fluxo financeiro mais restritivo, reduzindo o público elegível.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
