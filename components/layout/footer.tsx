import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Magnetic } from "@/components/motion/magnetic";
import { footer, pieces, sagaNav } from "@/lib/saga-content";

const columns = [
  { title: "Explorar", links: sagaNav.filter((item) => item.href.startsWith("/#")) },
  { title: "Soluções", links: pieces.items.map((item) => ({ label: item.name, href: "/#solucoes" })) },
];

export function Footer() {
  return (
    <footer id="site-footer" className="relative overflow-hidden bg-primary text-ink">
      <div className="container-convext pt-20 sm:pt-24">
        <div className="grid gap-12 border-b border-ink/20 pb-14 lg:grid-cols-[1.3fr_0.6fr_0.6fr]">
          <div>
            <p className="saga-eyebrow text-ink/60 [&::before]:bg-ink">Próximo movimento</p>
            <h2 className="saga-title mt-6 max-w-[14ch] text-[clamp(2.5rem,5vw,4.75rem)]">Sua próxima jogada começa aqui.</h2>
            <p className="mt-6 max-w-[40ch] text-sm leading-6 text-ink/70">{footer.next}</p>
            <Magnetic className="mt-8">
              <Link
                href="/#diagnostico"
                className="saga-press inline-flex h-12 items-center gap-2 rounded-full bg-ink pl-6 pr-5 text-sm text-foreground hover:bg-black"
              >
                Agendar diagnóstico <ArrowUpRight className="arrow-nudge size-4" />
              </Link>
            </Magnetic>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/55">{column.title}</p>
              <ul className="mt-5 space-y-3 text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="link-underline text-ink/80 hover:text-ink">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 py-6 text-xs text-ink/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Convext. Todos os direitos reservados.</p>
          <p className="max-w-[48ch] sm:text-right">{footer.about}</p>
        </div>
      </div>
      <p aria-hidden="true" className="pointer-events-none -mb-[0.14em] select-none overflow-hidden whitespace-nowrap text-center font-display text-[24vw] leading-[.8] tracking-[-.1em] text-ink">
        Convext
      </p>
    </footer>
  );
}
