"use client";

import { useEffect, useId, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY = "none";
const MINUTE_STEPS = ["00", "15", "30", "45"];

function splitTime(value?: string) {
  const match = value?.match(/^(\d{2}):(\d{2})$/);
  if (!match) return { hour: "", minute: "" };
  return { hour: match[1], minute: match[2] };
}

function minuteOptions(selected?: string) {
  const minutes = new Set(MINUTE_STEPS);
  if (selected && /^\d{2}$/.test(selected)) minutes.add(selected);
  return [...minutes].sort();
}

export function TimePartsField({
  value,
  onChange,
  disabled,
}: {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const [parts, setParts] = useState(() => splitTime(value));

  useEffect(() => {
    if (!value) return;
    setParts(splitTime(value));
  }, [value]);

  function emit(next: { hour: string; minute: string }) {
    setParts(next);
    if (next.hour && next.minute) {
      onChange(`${next.hour}:${next.minute}`);
      return;
    }
    if (value) onChange("");
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-hour`} className="text-xs text-muted-foreground">Hora</Label>
        <Select
          value={parts.hour || undefined}
          disabled={disabled}
          onValueChange={(hour) => emit({ ...parts, hour: hour === EMPTY ? "" : hour })}
        >
          <SelectTrigger id={`${id}-hour`} className="w-full"><SelectValue placeholder="Hora" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY}>Limpar</SelectItem>
            {Array.from({ length: 24 }, (_, index) => {
              const hour = String(index).padStart(2, "0");
              return <SelectItem key={hour} value={hour}>{hour}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-minute`} className="text-xs text-muted-foreground">Minuto</Label>
        <Select
          value={parts.minute || undefined}
          disabled={disabled}
          onValueChange={(minute) => emit({ ...parts, minute: minute === EMPTY ? "" : minute })}
        >
          <SelectTrigger id={`${id}-minute`} className="w-full"><SelectValue placeholder="Minuto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY}>Limpar</SelectItem>
            {minuteOptions(parts.minute).map((minute) => (
              <SelectItem key={minute} value={minute}>{minute}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
