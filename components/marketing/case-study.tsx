"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import type { CaseRecord } from "@/lib/case-model";
import { videoEmbedSrc } from "@/lib/case-model";

gsap.registerPlugin(useGSAP);

export function CaseStudy({ current, prev, next }: { current: CaseRecord; prev: CaseRecord | null; next: CaseRecord | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const embed = videoEmbedSrc(current.videoUrl);
  const concept = current.concept?.trim() || current.summary;
  const media = current.coverUrl || current.logoUrl;

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from(".case-study-media", { clipPath: "inset(10% 8% 10% 8%)", duration: 1.15, ease: "power3.out" });
  }, { scope: ref });

  return (
    <div ref={ref} className="pt-28">
      <Container className="pb-24 pt-10">
        <div className="grid gap-10 lg:grid-cols-[.95fr_1.05fr] lg:items-end">
          <h1 className="max-w-3xl font-display text-h1">{current.name}</h1>
          <p className="max-w-xl text-lg leading-relaxed text-foreground/70">{concept}</p>
        </div>

        <dl className="mt-14 grid gap-8 border-y border-border py-8 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Cliente" value={current.name} />
          <Meta label="Localização" value={current.location || "—"} />
          <Meta label="Segmento" value={current.segment} />
          <div>
            <dt className="label">Frentes aplicadas</dt>
            <dd className="mt-3 flex flex-wrap gap-2">
              {(current.fronts.length ? current.fronts : [current.segment]).map((front) => (
                <span key={front} className="rounded-full border border-border px-3 py-1 text-sm text-foreground/80">{front}</span>
              ))}
            </dd>
          </div>
        </dl>

        <Button asChild size="lg" className="mt-10 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90">
          <Link href="/contato">Fale com a Convext <ArrowUpRight /></Link>
        </Button>

        <div className="case-study-media relative mt-16 overflow-hidden rounded-[28px] border border-border bg-card">
          {embed ? (
            <div className="relative aspect-video">
              <iframe
                src={embed}
                title={`Filme de ${current.name}`}
                className="absolute inset-0 size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="relative aspect-[16/9]">
              <Image src={media} alt={current.name} fill className="object-cover" sizes="100vw" priority />
            </div>
          )}
        </div>

        {current.identities.length > 0 ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {current.identities.map((identity) => (
              <figure key={identity.url} className="overflow-hidden rounded-[28px] border border-border bg-card">
                <div className="relative aspect-[16/10]">
                  <Image src={identity.url} alt={identity.caption || current.name} fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
                </div>
                {identity.caption ? <figcaption className="px-5 py-4 text-sm text-foreground/60">{identity.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        ) : null}

        <nav className="mt-16 grid gap-4 border-t border-border pt-8 sm:grid-cols-2" aria-label="Outros cases">
          <Neighbor label="Case anterior" item={prev} align="start" />
          <Neighbor label="Próximo case" item={next} align="end" />
        </nav>
      </Container>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="mt-3 text-lg tracking-[-0.03em]">{value}</dd>
    </div>
  );
}

function Neighbor({ label, item, align }: { label: string; item: CaseRecord | null; align: "start" | "end" }) {
  if (!item) return <div />;
  return (
    <Link href={`/cases/${item.slug}`} className={align === "end" ? "sm:justify-self-end" : undefined}>
      <p className="label">{label}</p>
      <div className="mt-3 flex items-center gap-4">
        {align === "start" ? <ArrowLeft className="size-4 text-primary" /> : null}
        <div className="relative size-16 overflow-hidden rounded-2xl bg-secondary">
          <Image src={item.coverUrl || item.logoUrl} alt="" fill className="object-cover" sizes="64px" />
        </div>
        <div>
          <p className="text-xl tracking-[-0.04em]">{item.name}</p>
          <p className="text-sm text-foreground/55">{item.segment}</p>
        </div>
        {align === "end" ? <ArrowRight className="size-4 text-primary" /> : null}
      </div>
    </Link>
  );
}
