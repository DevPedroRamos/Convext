"use client";

import dynamic from "next/dynamic";
import { Container } from "@/components/layout/container";

const ThreeScene = dynamic(() => import("@/components/marketing/three-scene").then((mod) => mod.ThreeScene), {
  ssr: false,
  loading: () => <div className="h-[520px] rounded-3xl border border-border bg-secondary" />,
});

export function VisualExperience() {
  return (
    <section className="py-12 sm:py-20">
      <Container>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label text-primary">Tecnologia visual</p>
            <h2 className="mt-4 max-w-3xl font-display text-h2">Experiências digitais com profundidade.</h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">Uma camada sutil de Three.js reforça a estética tecnológica sem comprometer a performance.</p>
        </div>
        <ThreeScene />
      </Container>
    </section>
  );
}
