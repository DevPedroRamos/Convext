"use client";

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type PearlButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  open?: boolean;
};

export function PearlButton({ className, open = false, ...props }: PearlButtonProps) {
  return (
    <button
      type="button"
      data-open={open}
      className={cn("pearl-button", className)}
      aria-expanded={open}
      {...props}
    >
      <span className="wrap">
        <Zap className="size-7 fill-current" />
      </span>
    </button>
  );
}
