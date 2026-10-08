import { HeroLeadForm } from "@/components/forms/hero-lead-form";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(243,87,3,.16),transparent_34%),radial-gradient(circle_at_88%_72%,rgba(243,87,3,.1),transparent_32%)]" />
      <div className="relative z-10 flex min-h-screen items-center">
        <div className="container-convext py-28 sm:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
            <div>
              <p className="label mb-5">Marketing imobiliário</p>
              <h1 className="max-w-4xl font-display text-[clamp(2.25rem,4.4vw,4.25rem)] leading-[0.92] tracking-[-0.055em] text-foreground">
                <span className="block text-[calc(1em-8px)]">Mais leads qualificados.</span>
                <span className="block text-primary">Mais oportunidades para vender.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-foreground/75 sm:text-xl sm:leading-9">
                A Convext Mídias transforma mídia paga em uma operação de geração de leads de alta conversão para o mercado imobiliário, conectando estratégia, anúncios, criativos, dados e comercial.
              </p>
              <p className="mt-6 max-w-xl text-base leading-7 text-foreground/60 sm:text-lg">
                Porque gerar lead é fácil. Gerar lead que pode virar venda é o que importa.
              </p>
            </div>
            <HeroLeadForm />
          </div>
        </div>
      </div>
    </section>
  );
}
