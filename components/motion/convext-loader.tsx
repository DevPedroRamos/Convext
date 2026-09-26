"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ConvextLoader() {
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);
  const words = ["C", "CON", "CONVEXT", "CONVEXT"];

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = reduced
      ? [window.setTimeout(() => setDone(true), 200)]
      : [0, 280, 680, 1100].map((time, index) => window.setTimeout(() => setStep(index), time)).concat(window.setTimeout(() => setDone(true), 1450));
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <div className={cn("fixed inset-0 z-[100] grid place-items-center bg-background transition-opacity duration-500", done && "pointer-events-none opacity-0")}>
      <div className="text-center">
        <p className="font-display text-6xl tracking-[-.08em] text-foreground sm:text-8xl">{words[step]}</p>
        <div className="mt-8 h-1 w-64 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, (step + 1) * 28)}%` }} />
        </div>
      </div>
    </div>
  );
}
