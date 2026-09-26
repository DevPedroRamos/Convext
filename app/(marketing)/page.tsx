import { Hero } from "@/components/marketing/hero";
import { Marquee } from "@/components/motion/marquee";
import { MainCta } from "@/components/marketing/cta";
import { Manifesto } from "@/components/marketing/manifesto";
import { Metrics } from "@/components/marketing/metrics";
import { Projects } from "@/components/marketing/projects";
import { Services } from "@/components/marketing/services";
import { VisualExperience } from "@/components/marketing/visual-experience";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Marquee />
      <Services />
      <Projects />
      <Metrics />
      <VisualExperience />
      <MainCta />
    </>
  );
}
