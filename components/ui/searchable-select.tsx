"use client";

import { ChevronDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Input } from "@/components/ui/input";
import { filterSearchableOptions, type SearchableOption } from "@/lib/searchable-select";
import { cn } from "@/lib/utils";

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Escolha",
  emptyLabel = "Escolha",
  searchPlaceholder = "Buscar",
  disabled,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  emptyLabel?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => filterSearchableOptions(options, query), [options, query]);

  function choose(next: string) {
    onValueChange(next);
    setOpen(false);
    setQuery("");
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverPrimitive.Trigger
        type="button"
        disabled={disabled}
        className={cn(
          "flex h-8 w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50",
          className,
        )}
      >
        <span className={cn("min-w-0 truncate text-left", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-[100] w-[var(--radix-popover-trigger-width)] min-w-36 origin-(--radix-popover-content-transform-origin) overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-[0_16px_40px_rgba(0,0,0,0.55)] duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <div className="border-b border-border p-1.5">
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Buscar"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            <OptionButton active={!value} onClick={() => choose("")}>
              {emptyLabel}
            </OptionButton>
            {filtered.map((option) => (
              <OptionButton key={option.value} active={option.value === value} onClick={() => choose(option.value)}>
                {option.label}
              </OptionButton>
            ))}
            {filtered.length === 0 ? <p className="px-2.5 py-2 text-sm text-muted-foreground">Nada encontrado.</p> : null}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center rounded-md py-2 pr-8 pl-2.5 text-left text-sm outline-hidden",
        active ? "bg-primary text-primary-foreground" : "hover:bg-primary hover:text-primary-foreground",
      )}
    >
      {children}
    </button>
  );
}
