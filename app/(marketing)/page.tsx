import { Hero } from "@/components/marketing/hero";
import { Marquee } from "@/components/motion/marquee";
import { MainCta } from "@/components/marketing/cta";
import { Manifesto } from "@/components/marketing/manifesto";
import { Metrics } from "@/components/marketing/metrics";
import { Projects } from "@/components/marketing/projects";
import { Services } from "@/components/marketing/services";
import { ValueProposition } from "@/components/marketing/value-proposition";
import { listPublishedCases } from "@/lib/cases";

export default async function HomePage() {
  const cases = await listPublishedCases();
  return (
    <>
      <Hero />
      <Manifesto />
      <Marquee />
      <ValueProposition />
      <Services />
      <Metrics />
      <Projects cases={cases} />
      <MainCta />
    </>
  );
}
