import Image from "next/image";

import { cn } from "@/lib/utils";

type ConvextParallaxProps = {
  className?: string;
};

export function ConvextParallax({ className }: ConvextParallaxProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 isolate overflow-hidden bg-background",
        className,
      )}
      data-convext-parallax
    >
      <div className="absolute inset-0 bg-background" />

      <div
        className="absolute inset-[-8%] opacity-0 will-change-transform"
        data-parallax-bg
      >
        <Image
          src="/media/parallax/background.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div
        className="convext-parallax-breathe absolute inset-x-[-12%] bottom-[-30%] h-[72svh] rounded-[100%] bg-[radial-gradient(circle_at_48%_50%,rgba(255,255,255,0.26),rgba(18,103,137,0.22)_26%,rgba(243,87,3,0.10)_45%,transparent_70%)] opacity-0 blur-3xl will-change-transform"
        data-parallax-atmosphere
      />

      <div
        className="absolute inset-0 opacity-0 mix-blend-screen will-change-transform [background-image:radial-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(115deg,transparent_0%,rgba(255,255,255,.10)_45%,transparent_64%)] [background-size:5px_5px,100%_100%]"
        data-parallax-texture
      />

      <div
        className="absolute right-[-12%] top-1/2 h-[58vmin] w-[58vmin] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(243,87,3,.52)_0%,rgba(243,87,3,.28)_35%,transparent_72%)] opacity-0 blur-3xl will-change-transform max-lg:right-[-20%] max-sm:right-[-34%] max-sm:h-[72vmin] max-sm:w-[72vmin]"
        data-parallax-symbol-glow
      />

      <div
        className="absolute right-[-5vw] top-1/2 w-[min(54vw,820px)] -translate-y-1/2 opacity-0 mix-blend-screen will-change-transform max-lg:right-[-14vw] max-lg:w-[min(72vw,720px)] max-sm:right-1/2 max-sm:top-[56%] max-sm:w-[92vw] max-sm:translate-x-1/2"
        data-parallax-symbol
      >
        <Image
          src="/media/parallax/convext-symbol.png"
          alt=""
          width={1024}
          height={576}
          priority
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 72vw, 54vw"
          className="h-auto w-full object-contain"
        />
      </div>

      <div
        className="absolute inset-0 bg-background opacity-100"
        data-parallax-entry-overlay
      />
      <div
        className="absolute inset-0 bg-background opacity-0"
        data-parallax-exit-overlay
      />
    </div>
  );
}
