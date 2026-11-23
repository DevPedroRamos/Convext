import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { SplitLines } from "@/components/motion/split-lines";
import { Wordmark } from "@/components/motion/wordmark";
import { Magnetic } from "@/components/motion/magnetic";
import { Button } from "@/components/ui/button";
import { RollLabel } from "@/components/ui/roll-label";
import { siteConfig } from "@/lib/site";

const columns = [
  { title: "Convext", links: [{ label: "Sobre", href: "/#sobre" }, { label: "Cases", href: "/#cases" }, { label: "Contato", href: "/contato" }] },
  { title: "Serviços", links: siteConfig.services.slice(0, 4).map((service) => ({ label: service.title, href: "/#servicos" })) },
  { title: "Social", links: [{ label: "Instagram", href: siteConfig.contact.instagram }, { label: "LinkedIn", href: siteConfig.contact.linkedin }, { label: "Behance", href: siteConfig.contact.behance }] },
];

export function Footer() {
  return (
    <footer id="site-footer" className="relative overflow-hidden bg-primary text-primary-foreground">
      <Container className="py-10 sm:py-16">
        <div className="grid gap-10 border-b border-black/20 pb-12 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <p className="label">Contato</p>
            <SplitLines as="h2" className="mt-5 max-w-2xl text-h2 font-display">Convext Mídias. Performance para o mercado imobiliário.</SplitLines>
            <p className="mt-6 max-w-md text-sm text-black/70">Vamos construir uma estratégia para gerar mais oportunidades para o seu time de vendas.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="label">{column.title}</p>
                <ul className="mt-5 space-y-3 text-sm">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="group/link inline-flex items-center gap-1 text-black/80 transition-colors duration-300 hover:text-black">
                        <span className="link-underline">{link.label}</span> <ArrowUpRight className="arrow-nudge size-3" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs uppercase tracking-[.16em] text-black/60">© 2026 Convext. Todos os direitos reservados.</p>
          <Magnetic className="w-fit">
            <Button asChild variant="secondary" size="lg" className="h-11 w-fit rounded-full bg-black px-5 text-white hover:bg-black">
              <Link href="/contato"><RollLabel>Quero falar com a Convext</RollLabel> <ArrowUpRight className="arrow-nudge" /></Link>
            </Button>
          </Magnetic>
        </div>
        <Wordmark text="Convext" className="select-none overflow-hidden font-display text-[24vw] leading-[.72] tracking-[-.12em] text-black/90 sm:text-[20vw]" />
      </Container>
    </footer>
  );
}
