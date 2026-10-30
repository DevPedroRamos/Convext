"use client";

import type { LucideIcon } from "lucide-react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export type CircularNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  locked?: boolean;
  onSelect?: () => void;
};

export function CircularNavigation({
  items,
  isOpen,
  onClose,
}: {
  items: CircularNavItem[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const start = 182;
  const end = 268;
  const radius = 272;

  return (
    <>
      <button
        type="button"
        aria-label="Fechar atalhos"
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <div className="pointer-events-none absolute inset-0 z-40">
        {items.map((item, index) => {
          const angle = start + ((end - start) * index) / Math.max(items.length - 1, 1);
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const Icon = item.locked ? Lock : item.icon;

          return (
            <button
              key={item.id}
              type="button"
              disabled={item.locked || !isOpen}
              aria-disabled={item.locked}
              tabIndex={isOpen && !item.locked ? 0 : -1}
              className={cn(
                "circular-nav-item absolute flex w-[4.75rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 text-center outline-none transition-all duration-300",
                isOpen ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-50 opacity-0",
                !item.locked && "hover:z-10"
              )}
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transitionDelay: isOpen ? `${index * 40}ms` : "0ms",
              }}
              onClick={() => {
                if (item.locked) return;
                item.onSelect?.();
                onClose();
              }}
            >
              <span
                className={cn(
                  "circular-nav-icon pointer-events-none grid size-12 place-items-center rounded-full border transition-all duration-200",
                  item.locked
                    ? "border-border bg-card/60 text-muted-foreground backdrop-blur-md"
                    : "border-border bg-secondary text-foreground"
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className={cn(
                "circular-nav-label pointer-events-none line-clamp-2 text-[11px] leading-tight",
                item.locked ? "text-muted-foreground blur-[2px]" : "text-foreground"
              )}>
                {item.locked ? "Mais funções em breve..." : item.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
