"use client";

import { X } from "lucide-react";
import { useMemo } from "react";
import { Field } from "@/components/finance/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AppointmentInput } from "@/lib/validations/spaces";

export type AttendeeOption = { id: string; name: string };

const PRESETS = [30, 60, 90, 120];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function toAppointmentParts(iso: string) {
  const date = new Date(iso);
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function toIso(date: string, time: string) {
  if (!date || !time) return "";
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

export function AppointmentField({
  required,
  value,
  attendees,
  onChange,
  disabled,
}: {
  required: boolean;
  value: AppointmentInput | null;
  attendees: AttendeeOption[];
  onChange: (value: AppointmentInput | null) => void;
  disabled?: boolean;
}) {
  const enabled = required || Boolean(value);
  const parts = value?.startsAt && !Number.isNaN(new Date(value.startsAt).getTime()) ? toAppointmentParts(value.startsAt) : { date: "", time: "" };
  const duration = value?.durationMinutes ?? 60;
  const preset = PRESETS.includes(duration) ? String(duration) : "other";
  const names = useMemo(() => Object.fromEntries(attendees.map((item) => [item.id, item.name])), [attendees]);
  const remaining = attendees.filter((item) => !(value?.attendeeIds ?? []).includes(item.id));

  function patch(next: Partial<AppointmentInput> & { date?: string; time?: string; enabled?: boolean }) {
    if (next.enabled === false) {
      onChange(null);
      return;
    }
    const date = next.date ?? parts.date;
    const time = next.time ?? parts.time;
    onChange({
      startsAt: toIso(date, time) || (next.date !== undefined || next.time !== undefined ? "" : value?.startsAt ?? ""),
      durationMinutes: next.durationMinutes ?? duration,
      location: next.location ?? value?.location ?? "",
      attendeeIds: next.attendeeIds ?? value?.attendeeIds ?? [],
    });
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border p-3">
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>Agendar compromisso</span>
        <Switch checked={enabled} disabled={disabled || required} onCheckedChange={(checked) => patch({ enabled: checked })} />
      </label>
      {enabled ? (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Data *">
              <Input type="date" value={parts.date} disabled={disabled} onChange={(event) => patch({ date: event.target.value })} />
            </Field>
            <Field label="Hora de início *">
              <Input type="time" value={parts.time} disabled={disabled} onChange={(event) => patch({ time: event.target.value })} />
            </Field>
          </div>
          <Field label="Duração">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
              <Select value={preset} disabled={disabled} onValueChange={(next) => patch({ durationMinutes: next === "other" ? 45 : Number(next) })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRESETS.map((item) => <SelectItem key={item} value={String(item)}>{item} min</SelectItem>)}
                  <SelectItem value="other">Outra</SelectItem>
                </SelectContent>
              </Select>
              {preset === "other" ? (
                <Input type="number" min={15} max={720} value={duration} disabled={disabled} onChange={(event) => patch({ durationMinutes: Number(event.target.value) || 15 })} aria-label="Minutos" />
              ) : null}
            </div>
          </Field>
          <Field label="Local">
            <Input maxLength={200} value={value?.location ?? ""} disabled={disabled} placeholder="Ex.: Econ Parque do Carmo" onChange={(event) => patch({ location: event.target.value })} />
          </Field>
          <Field label="Participantes *">
            <div className="grid gap-2">
              {value?.attendeeIds.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {value.attendeeIds.map((id) => (
                    <Badge key={id} variant="outline" className="gap-1">
                      {names[id] ?? id}
                      {disabled ? null : (
                        <Button type="button" size="icon" variant="ghost" className="size-4" aria-label={`Remover ${names[id] ?? "participante"}`} onClick={() => patch({ attendeeIds: value.attendeeIds.filter((item) => item !== id) })}>
                          <X className="size-3" />
                        </Button>
                      )}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <SearchableSelect
                value=""
                onValueChange={(id) => {
                  if (!id || value?.attendeeIds.includes(id)) return;
                  patch({ attendeeIds: [...(value?.attendeeIds ?? []), id] });
                }}
                options={remaining.map((item) => ({ value: item.id, label: item.name }))}
                placeholder="Adicionar participante"
                emptyLabel="Adicionar participante"
                disabled={disabled || remaining.length === 0}
              />
            </div>
          </Field>
        </div>
      ) : null}
    </div>
  );
}
