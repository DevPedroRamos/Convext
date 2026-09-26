"use client";

import { SplitLines } from "@/components/motion/split-lines";

export function RevealText({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <SplitLines className={className}>
      {lines.map((line) => <span className="block" key={line}>{line}</span>)}
    </SplitLines>
  );
}
