"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RollLabel } from "@/components/ui/roll-label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
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
      className={cn(
        "fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-transform duration-700 ease-expo sm:px-5",
        hidden && "-translate-y-[calc(100%+1rem)]",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-[1520px] items-center justify-between rounded-2xl border border-white/10 bg-background/70 px-4 backdrop-blur-2xl transition-[height,box-shadow] duration-500 ease-expo",
          scrolled ? "h-14 shadow-2xl shadow-black/30" : "h-17",
        )}
      >
        <Link href="/" className="flex items-center gap-3" aria-label="Convext home">
          <Image
            src="/brand/logo-lockup.png"
            alt="Convext"
            width={778}
            height={210}
            className="h-9 w-auto object-contain sm:h-10"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={item.href} className="link-underline text-sm text-foreground/70 hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild size="lg" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/contato">
              <RollLabel>Vamos conversar</RollLabel> <ArrowUpRight className="arrow-nudge" />
            </Link>
          </Button>
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon" aria-label="Abrir menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="border-border bg-background">
            <div className="mt-10 grid gap-6">
              {siteConfig.nav.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  style={{ animationDelay: `${120 + index * 60}ms` }}
                  className="font-display text-4xl tracking-[-0.05em] text-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-8 motion-safe:fill-mode-both motion-safe:duration-700"
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild size="lg" className="mt-4 h-12 rounded-xl bg-primary text-primary-foreground">
                <Link href="/contato" onClick={() => setMenuOpen(false)}>Vamos conversar <ArrowUpRight /></Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
