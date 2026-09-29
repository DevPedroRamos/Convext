import { Hero } from "@/components/marketing/hero";
import { Marquee } from "@/components/motion/marquee";
import { MainCta } from "@/components/marketing/cta";
import { Differentials } from "@/components/marketing/differentials";
import { Manifesto } from "@/components/marketing/manifesto";
import { Metrics } from "@/components/marketing/metrics";
import { Method } from "@/components/marketing/method";
import { Philosophy } from "@/components/marketing/philosophy";
import { Positioning } from "@/components/marketing/positioning";
import { Problem } from "@/components/marketing/problem";
import { Projects } from "@/components/marketing/projects";
import { Services } from "@/components/marketing/services";
import { VisualExperience } from "@/components/marketing/visual-experience";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Marquee />
      <Positioning />
      <Problem />
      <Philosophy />
      <Services />
      <Method />
      <Differentials />
      <Projects />
      <Metrics />
      <VisualExperience />
      <MainCta />
    </>
  );
}
