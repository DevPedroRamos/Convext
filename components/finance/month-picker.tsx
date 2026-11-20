"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addMonths } from "@/lib/finance/dates";

/** Seletor de competência guardado em ?mes=AAAA-MM. */
export function MonthPicker({ month, param = "mes" }: { month: string; param?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = month.slice(0, 7);

  function go(value: string) {
    if (!/^\d{4}-\d{2}$/.test(value)) return;
    const params = new URLSearchParams(searchParams?.toString());
    params.set(param, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="outline" size="icon" aria-label="Mês anterior" onClick={() => go(addMonths(`${key}-01`, -1).slice(0, 7))}>
        <ChevronLeft />
      </Button>
      <Input type="month" value={key} onChange={(event) => go(event.target.value)} className="w-40" aria-label="Competência" />
      <Button type="button" variant="outline" size="icon" aria-label="Próximo mês" onClick={() => go(addMonths(`${key}-01`, 1).slice(0, 7))}>
        <ChevronRight />
      </Button>
    </div>
  );
}
