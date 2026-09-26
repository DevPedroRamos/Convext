"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FRAME_COUNT = 182;

function frameSrc(index: number) {
  return `/media/hero-frames/frame-${String(index + 1).padStart(4, "0")}.webp`;
}

export function HeroFrameSequence({ className }: { className?: string }) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef(-1);

  useGSAP(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const drawFrame = (index: number) => {
      const nextIndex = Math.max(0, Math.min(FRAME_COUNT - 1, index));
      const image = imagesRef.current[nextIndex];
      if (!image?.complete || !image.naturalWidth || frameRef.current === nextIndex) return;

      frameRef.current = nextIndex;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const imageRatio = image.naturalWidth / image.naturalHeight;
      const canvasRatio = width / height;
      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (imageRatio > canvasRatio) {
        drawHeight = height;
        drawWidth = height * imageRatio;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / imageRatio;
        offsetY = (height - drawHeight) / 2;
      }

      context.clearRect(0, 0, width, height);
      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    };

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      frameRef.current = -1;
      drawFrame(Math.max(0, frameRef.current));
    };

    imagesRef.current = Array.from({ length: FRAME_COUNT }, (_, index) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = frameSrc(index);
      if (index === 0) image.onload = () => drawFrame(0);
      return image;
    });

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return () => window.removeEventListener("resize", resizeCanvas);
    }

    const trigger = canvas.closest("section") || canvas;
    const scrollTrigger = ScrollTrigger.create({
      trigger,
      start: "top top",
      end: "+=110%",
      scrub: true,
      onUpdate: (self) => {
        drawFrame(Math.round(self.progress * (FRAME_COUNT - 1)));
      },
    });

    return () => {
      scrollTrigger.kill();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, { scope: scopeRef });

  return (
    <div ref={scopeRef} className={cn("absolute inset-0 bg-black", className)}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-label="Animação visual Convext controlada pelo scroll"
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/hero-poster.webp" alt="Convext" className="h-full w-full object-cover" />
      </noscript>
    </div>
  );
}
