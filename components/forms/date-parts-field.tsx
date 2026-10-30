"use client";

import { useId, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const months = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
] as const;

const EMPTY = "none";

function splitDate(value?: string) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { year: "", month: "", day: "" };
  return { year: match[1], month: match[2], day: match[3] };
}

function daysInMonth(year: string, month: string) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function yearOptions() {
  const current = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, index) => String(current - 1 + index));
}

export function DatePartsField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const [parts, setParts] = useState(() => splitDate(value));
  const maxDay = daysInMonth(parts.year, parts.month);

  function emit(next: { year: string; month: string; day: string }) {
    const last = daysInMonth(next.year, next.month);
    const day = next.day && Number(next.day) > last ? String(last).padStart(2, "0") : next.day;
    const resolved = { ...next, day };
    setParts(resolved);
    if (resolved.year && resolved.month && resolved.day) {
      onChange(`${resolved.year}-${resolved.month}-${resolved.day}`);
      return;
    }
    if (value) onChange("");
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-day`} className="text-xs text-muted-foreground">Dia</Label>
        <Select
          value={parts.day || undefined}
          onValueChange={(day) => emit({ ...parts, day: day === EMPTY ? "" : day })}
        >
          <SelectTrigger id={`${id}-day`} className="w-full"><SelectValue placeholder="Dia" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY}>Limpar</SelectItem>
            {Array.from({ length: maxDay }, (_, index) => {
              const day = String(index + 1).padStart(2, "0");
              return <SelectItem key={day} value={day}>{index + 1}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-month`} className="text-xs text-muted-foreground">Mês</Label>
        <Select
          value={parts.month || undefined}
          onValueChange={(month) => emit({ ...parts, month: month === EMPTY ? "" : month })}
        >
          <SelectTrigger id={`${id}-month`} className="w-full"><SelectValue placeholder="Mês" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY}>Limpar</SelectItem>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-year`} className="text-xs text-muted-foreground">Ano</Label>
        <Select
          value={parts.year || undefined}
          onValueChange={(year) => emit({ ...parts, year: year === EMPTY ? "" : year })}
        >
          <SelectTrigger id={`${id}-year`} className="w-full"><SelectValue placeholder="Ano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY}>Limpar</SelectItem>
            {yearOptions().map((year) => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
