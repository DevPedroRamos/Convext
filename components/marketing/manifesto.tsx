import { Container } from "@/components/layout/container";
import { RevealText } from "@/components/motion/reveal-text";

export function Manifesto() {
  return (
    <section id="sobre" className="bg-primary py-20 text-primary-foreground sm:py-28 lg:py-36">
      <Container>
        <p className="label mb-8 text-black/50">Manifesto</p>
        <RevealText
          className="max-w-6xl font-display text-h2 text-black"
          lines={["A Convext conecta criatividade,", "estratégia e tecnologia", "para construir marcas", "que não passam despercebidas."]}
        />
      </Container>
    </section>
  );
}
