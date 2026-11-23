import { HeroLeadForm } from "@/components/forms/hero-lead-form";
import { HeroGlow } from "@/components/marketing/hero-glow";
import { siteConfig } from "@/lib/site";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export function Hero() {
  const proof = siteConfig.metrics.slice(0, 3);

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      <HeroGlow />
      <div className="relative z-10 flex min-h-screen items-center">
        <div className="container-convext py-28 sm:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
            <div>
              <div className="hero-fade mb-6 flex flex-wrap items-center gap-3" style={delay(80)}>
                <p className="label">Marketing imobiliário</p>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-foreground/75">
                  <span className="pulse-dot size-1.5 rounded-full bg-primary" aria-hidden="true" />
                  Atuação em São Paulo e Rio de Janeiro
                </span>
              </div>
              <h1 className="max-w-4xl font-display text-[clamp(2.25rem,4.4vw,4.25rem)] leading-[0.92] tracking-[-0.055em] text-foreground">
                <span className="hero-line text-[calc(1em-8px)]">
                  <span style={delay(160)}>Mais leads qualificados.</span>
                </span>
                <span className="hero-line text-primary">
                  <span style={delay(280)}>Mais oportunidades para vender.</span>
                </span>
              </h1>
              <p className="hero-fade mt-7 max-w-xl text-lg leading-8 text-foreground/75 sm:text-xl sm:leading-9" style={delay(480)}>
                A Convext Mídias transforma mídia paga em uma operação de geração de leads de alta conversão para o mercado imobiliário, conectando estratégia, anúncios, criativos, dados e comercial.
              </p>
              <p className="hero-fade mt-6 max-w-xl text-base leading-7 text-foreground/60 sm:text-lg" style={delay(580)}>
                Porque gerar lead é fácil. Gerar lead que pode virar venda é o que importa.
              </p>

              <dl className="hero-fade mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-6" style={delay(700)}>
                {proof.map((metric) => (
                  <div key={metric.label}>
                    <dt className="sr-only">{metric.label}</dt>
                    <dd className="font-display text-2xl tracking-[-0.05em] text-foreground sm:text-3xl">
                      {metric.prefix}{metric.value}{metric.suffix}
                    </dd>
                    <dd className="mt-1 text-xs leading-5 text-muted-foreground" aria-hidden="true">{metric.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div id="hero-lead-form" className="hero-form scroll-mt-28" style={delay(380)}>
              <HeroLeadForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
