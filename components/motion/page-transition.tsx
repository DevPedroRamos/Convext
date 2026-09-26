"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PageTransition({ subtle = false }: { subtle?: boolean }) {
  const pathname = usePathname();
  return (
    <div
      key={pathname}
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[90] origin-top scale-y-0 bg-primary",
        subtle ? "h-1 animate-[convext-subtle-reveal_260ms_ease-out]" : "h-screen animate-[convext-page-reveal_700ms_cubic-bezier(.76,0,.24,1)]",
      )}
    />
  );
}
