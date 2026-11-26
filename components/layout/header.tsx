"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { sagaNav } from "@/lib/saga-content";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [light, setLight] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      // Sobre seções claras o cabeçalho vira pílula escura: o logo é branco e sumiria no fundo bone.
      // Consulta a cada rolagem porque a página chega por streaming depois do cabeçalho.
      const band = 48;
      setLight(
        [...document.querySelectorAll("[data-header-theme='light']")].some((section) => {
          const rect = section.getBoundingClientRect();
          return rect.top <= band && rect.bottom >= band;
        }),
      );
      // Seção atual no menu: a que cruza a linha a 35% da altura da tela.
      const probe = window.innerHeight * 0.35;
      const current = sagaNav.find((item) => {
        const id = item.href.split("#")[1];
        const rect = id ? document.getElementById(id)?.getBoundingClientRect() : undefined;
        return rect ? rect.top <= probe && rect.bottom > probe : false;
      });
      setActive(current?.href ?? null);
      // Esconde ao descer, reaparece ao subir (com folga para não piscar).
      if (Math.abs(y - lastY) > 6) {
        setHidden(y > lastY && y > 240);
        lastY = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-theme={light ? "light" : "dark"}
      className={cn(
        "fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-transform duration-500 ease-quint sm:px-5",
        hidden && !menuOpen && "-translate-y-[calc(100%+1rem)]",
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-14 max-w-[1520px] items-center justify-between rounded-full border px-3 pl-5 transition-[background-color,border-color,color,box-shadow] duration-300 ease-out",
          light || scrolled
            ? "border-white/10 bg-ink/80 text-foreground shadow-2xl shadow-black/30 backdrop-blur-xl"
            : "border-transparent bg-transparent text-foreground",
        )}
      >
        <Link href="/" aria-label="Convext — início" className="flex items-center">
          <Image src="/brand/logo-lockup.png" alt="Convext" width={778} height={210} className="h-8 w-auto object-contain sm:h-9" priority />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">
          {sagaNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active === item.href ? "location" : undefined}
              className="nav-link relative text-sm opacity-65 transition-opacity duration-200 hover:opacity-100 aria-[current]:opacity-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/#diagnostico"
            className="saga-press hidden h-10 items-center gap-2 rounded-full bg-primary pl-4 pr-3.5 text-sm text-primary-foreground hover:bg-[#ff6512] sm:inline-flex"
          >
            Solicitar diagnóstico <ArrowUpRight className="arrow-nudge size-4" />
          </Link>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button type="button" aria-label="Abrir menu" className="saga-press grid size-10 place-items-center rounded-full border border-current/15 md:hidden">
                <Menu className="size-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="border-white/10 bg-ink">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <nav className="mt-14 grid gap-1 px-6" aria-label="Navegação">
                {sagaNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="border-b border-white/10 py-4 font-display text-3xl tracking-[-0.05em] text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/#diagnostico"
                  onClick={() => setMenuOpen(false)}
                  className="saga-press mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm text-primary-foreground"
                >
                  Solicitar diagnóstico <ArrowUpRight className="size-4" />
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
