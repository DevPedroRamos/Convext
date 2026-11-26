import type { Metadata } from "next";
import { Cases } from "@/components/saga/cases";
import { Diagnostic } from "@/components/saga/diagnostic";
import { Faq } from "@/components/saga/faq";
import { FloatingCta } from "@/components/saga/floating-cta";
import { SagaHero } from "@/components/saga/hero";
import { Manifesto } from "@/components/saga/manifesto";
import { MethodBoard } from "@/components/saga/method-board";
import { PathMarquee } from "@/components/saga/path-marquee";
import { PiecesIndex } from "@/components/saga/pieces-index";
import { Audience, Numbers, Problem, SagaOs, Team } from "@/components/saga/sections";
import { listPublishedCases } from "@/lib/cases";

export const metadata: Metadata = {
  title: { absolute: "Saga — Marketing e comercial para o mercado imobiliário" },
  description:
    "Assessoria e consultoria de marketing e comercial para o mercado imobiliário. Sua marca vista, lembrada, escolhida — e vendendo.",
};

export default async function HomePage() {
  const published = await listPublishedCases();
  const covers = Object.fromEntries(
    published.filter((item) => item.slug && (item.coverUrl || item.logoUrl)).map((item) => [item.slug, item.coverUrl || item.logoUrl]),
  );
  return (
    <>
      <SagaHero />
      <PathMarquee />
      <Manifesto />
      <Numbers />
      <Problem />
      <MethodBoard />
      <PiecesIndex />
      <Audience />
      <SagaOs />
      <Cases publishedSlugs={published.map((item) => item.slug).filter(Boolean)} covers={covers} />
      <Team />
      <Faq />
      <Diagnostic />
      <FloatingCta />
    </>
  );
}
