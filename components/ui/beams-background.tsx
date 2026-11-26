"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Feixes de luz subindo em diagonal, desfocados. Adaptado do componente
 * "beams background": ocupa o container (não a janela), usa a paleta laranja
 * da marca, desenha em 1x (o desfoque esconde a resolução) e pausa fora da tela.
 */

interface Beam {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  hue: number;
  lightness: number;
  pulse: number;
  pulseSpeed: number;
}

type Intensity = "subtle" | "medium" | "strong";
const opacityMap: Record<Intensity, number> = { subtle: 0.6, medium: 0.8, strong: 1 };

function createBeam(width: number, height: number, hues: [number, number]): Beam {
  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 30 + Math.random() * 60,
    length: height * 2.5,
    angle: -35 + Math.random() * 10,
    speed: 0.3 + Math.random() * 0.6,
    opacity: 0.12 + Math.random() * 0.16,
    hue: hues[0] + Math.random() * (hues[1] - hues[0]),
    lightness: 48 + Math.random() * 14,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.01 + Math.random() * 0.02,
  };
}

export function BeamsBackground({
  className,
  children,
  intensity = "medium",
  hues = [14, 30],
  beams = 14,
}: {
  className?: string;
  children?: React.ReactNode;
  intensity?: Intensity;
  /** Faixa de matiz (HSL). Padrão: laranjas da marca. */
  hues?: [number, number];
  beams?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hueMin, hueMax] = hues;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;

    let list: Beam[] = [];
    let frame = 0;
    let running = false;
    let width = 0;
    let height = 0;

    const resize = () => {
      width = root.clientWidth;
      height = root.clientHeight;
      canvas.width = width;
      canvas.height = height;
      list = Array.from({ length: beams }, () => createBeam(width, height, [hueMin, hueMax]));
    };

    const reset = (beam: Beam, index: number) => {
      const column = index % 3;
      const spacing = width / 3;
      beam.y = height + 100;
      beam.x = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.5;
      beam.width = 80 + Math.random() * 90;
      beam.speed = 0.3 + Math.random() * 0.35;
      beam.hue = hueMin + ((hueMax - hueMin) * index) / list.length;
      beam.opacity = 0.18 + Math.random() * 0.12;
    };

    const draw = (beam: Beam) => {
      ctx.save();
      ctx.translate(beam.x, beam.y);
      ctx.rotate((beam.angle * Math.PI) / 180);
      const alpha = beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.2) * opacityMap[intensity];
      const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);
      const color = (a: number) => `hsla(${beam.hue}, 95%, ${beam.lightness}%, ${a})`;
      gradient.addColorStop(0, color(0));
      gradient.addColorStop(0.1, color(alpha * 0.5));
      gradient.addColorStop(0.4, color(alpha));
      gradient.addColorStop(0.6, color(alpha));
      gradient.addColorStop(0.9, color(alpha * 0.5));
      gradient.addColorStop(1, color(0));
      ctx.fillStyle = gradient;
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      ctx.restore();
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.filter = "blur(35px)";
      list.forEach((beam, index) => {
        beam.y -= beam.speed;
        beam.pulse += beam.pulseSpeed;
        if (beam.y + beam.length < -100) reset(beam, index);
        draw(beam);
      });
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    const visibility = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    visibility.observe(root);

    return () => {
      stop();
      resizeObserver.disconnect();
      visibility.disconnect();
    };
  }, [intensity, hueMin, hueMax, beams]);

  return (
    <div ref={rootRef} className={cn("relative overflow-hidden bg-ink", className)}>
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" style={{ filter: "blur(15px)" }} />
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-ink/5"
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 10, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
        style={{ backdropFilter: "blur(50px)" }}
      />
      {children ? <div className="relative z-10 h-full">{children}</div> : null}
    </div>
  );
}
