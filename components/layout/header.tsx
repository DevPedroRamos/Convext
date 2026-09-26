"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div
        className={cn(
          "mx-auto flex max-w-[1520px] items-center justify-between rounded-2xl border border-white/10 bg-background/70 px-4 backdrop-blur-2xl transition-all duration-300",
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
            <Link key={item.href} href={item.href} className="text-sm text-foreground/70 transition hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild size="lg" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/contato">
              Vamos conversar <ArrowUpRight className="transition group-hover/button:translate-x-0.5 group-hover/button:-translate-y-0.5" />
            </Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon" aria-label="Abrir menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="border-border bg-background">
            <div className="mt-10 grid gap-6">
              {siteConfig.nav.map((item) => (
                <Link key={item.href} href={item.href} className="text-2xl text-foreground">
                  {item.label}
                </Link>
              ))}
              <Button asChild className="mt-4 bg-primary text-primary-foreground">
                <Link href="/contato">Vamos conversar</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
