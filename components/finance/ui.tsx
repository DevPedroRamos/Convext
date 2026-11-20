import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="label text-primary">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl tracking-[-0.04em] sm:text-4xl">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({ title, value, hint, tone, href }: { title: string; value: string; hint?: string; tone?: "positive" | "negative" | "warning"; href?: string }) {
  const card = (
    <div className="surface grid h-full gap-1 p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p
        className={cn(
          "font-display text-2xl tracking-[-0.04em] tabular-nums sm:text-3xl",
          tone === "positive" && "text-emerald-400",
          tone === "negative" && "text-destructive",
          tone === "warning" && "text-primary",
        )}
      >
        {value}
      </p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
  if (!href) return card;
  return (
    <Link href={href} className="rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring">
      {card}
    </Link>
  );
}

const toneClasses = {
  neutral: "",
  info: "border-sky-500/40 text-sky-300",
  positive: "border-emerald-500/40 text-emerald-300",
  warning: "border-primary/50 text-primary",
  negative: "border-destructive/50 text-destructive",
} as const;

export type Tone = keyof typeof toneClasses;

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <Badge variant="outline" className={toneClasses[tone]}>
      {label}
    </Badge>
  );
}

export function Field({ label, error, children, className, hint }: { label: string; error?: string; children: ReactNode; className?: string; hint?: string }) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label>{label}</Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="surface p-8 text-sm text-muted-foreground">{children}</div>;
}

export function Section({ title, actions, children, className }: { title: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("surface grid gap-4 p-5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-medium">{title}</h3>
        {actions}
      </div>
      {children}
    </section>
  );
}

export const nativeSelectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>option]:bg-background";
