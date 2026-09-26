import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { SplitLines } from "@/components/motion/split-lines";
import { Wordmark } from "@/components/motion/wordmark";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

const columns = [
  { title: "Convext", links: [{ label: "Sobre", href: "/#sobre" }, { label: "Cases", href: "/#cases" }, { label: "Contato", href: "/contato" }] },
  { title: "Serviços", links: siteConfig.services.slice(0, 4).map((service) => ({ label: service.title, href: "/#servicos" })) },
  { title: "Social", links: [{ label: "Instagram", href: siteConfig.contact.instagram }, { label: "LinkedIn", href: siteConfig.contact.linkedin }, { label: "Behance", href: siteConfig.contact.behance }] },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-primary text-primary-foreground">
      <Container className="py-10 sm:py-16">
        <div className="grid gap-10 border-b border-black/20 pb-12 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <p className="label text-black/60">Contato</p>
            <SplitLines as="h2" className="mt-5 max-w-2xl text-h2 font-display">Tem uma ideia? Vamos transformar em algo grande.</SplitLines>
            <p className="mt-6 max-w-md text-sm text-black/70">Estratégia, criação e tecnologia para marcas que precisam ganhar movimento.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="label text-black/50">{column.title}</p>
                <ul className="mt-5 space-y-3 text-sm">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="inline-flex items-center gap-1 text-black/80 transition hover:text-black">
                        {link.label} <ArrowUpRight className="size-3" />
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
          <Button asChild variant="secondary" className="w-fit bg-black text-white hover:bg-black/80">
            <Link href="/contato">Fale com a Convext <ArrowUpRight /></Link>
          </Button>
        </div>
        <Wordmark text="Convext" className="select-none overflow-hidden font-display text-[24vw] leading-[.72] tracking-[-.12em] text-black/90 sm:text-[20vw]" />
      </Container>
    </footer>
  );
}
