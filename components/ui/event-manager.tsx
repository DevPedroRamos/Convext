"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CalendarEventItem = {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  location?: string;
};

type View = "month" | "week" | "day" | "list";

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function onDay(event: CalendarEventItem, day: Date) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const from = startOfDay(day);
  const to = addDays(from, 1);
  return start < to && end > from;
}

function formatHeading(view: View, cursor: Date) {
  if (view === "day") return cursor.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  if (view === "week") {
    const from = startOfWeek(cursor);
    const to = addDays(from, 6);
    return `${from.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} – ${to.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function visibleRange(view: View, cursor: Date) {
  if (view === "day") {
    const from = startOfDay(cursor);
    return { from: from.toISOString(), to: addDays(from, 1).toISOString() };
  }
  if (view === "week" || view === "list") {
    const from = startOfWeek(cursor);
    return { from: from.toISOString(), to: addDays(from, 7).toISOString() };
  }
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  return { from: gridStart.toISOString(), to: addDays(gridStart, 42).toISOString() };
}

function EventChip({ event, onClick }: { event: CalendarEventItem; onClick?: (event: CalendarEventItem) => void }) {
  const start = new Date(event.start);
  return (
    <button
      type="button"
      className="w-full truncate rounded-md px-1.5 py-0.5 text-left text-xs text-foreground"
      style={{ background: `${event.color}33`, boxShadow: `inset 3px 0 0 ${event.color}` }}
      onClick={() => onClick?.(event)}
    >
      {start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} {event.title}
    </button>
  );
}

export function EventManager({
  events,
  onEventClick,
  onRangeChange,
  toolbar,
}: {
  events: CalendarEventItem[];
  onEventClick?: (event: CalendarEventItem) => void;
  onRangeChange?: (range: { from: string; to: string }) => void;
  toolbar?: ReactNode;
}) {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [today] = useState(() => startOfDay(new Date()));
  const [query, setQuery] = useState("");
  const lastRange = useRef("");

  const range = useMemo(() => visibleRange(view, cursor), [view, cursor]);
  useEffect(() => {
    const key = `${range.from}|${range.to}`;
    if (lastRange.current === key) return;
    lastRange.current = key;
    onRangeChange?.(range);
  }, [range, onRangeChange]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return events.filter((event) => !term || event.title.toLowerCase().includes(term) || (event.location ?? "").toLowerCase().includes(term));
  }, [events, query]);

  function shift(step: number) {
    const next = new Date(cursor);
    if (view === "day") next.setDate(next.getDate() + step);
    else if (view === "week" || view === "list") next.setDate(next.getDate() + step * 7);
    else next.setMonth(next.getMonth() + step);
    setCursor(startOfDay(next));
  }

  const weekdays = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursor), index).toLocaleDateString("pt-BR", { weekday: "short" }));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button type="button" size="icon" variant="outline" aria-label="Anterior" onClick={() => shift(-1)}><ChevronLeft /></Button>
          <Button type="button" size="icon" variant="outline" aria-label="Próximo" onClick={() => shift(1)}><ChevronRight /></Button>
          <Button type="button" variant="ghost" onClick={() => setCursor(startOfDay(new Date()))}>Hoje</Button>
        </div>
        <p className="min-w-40 flex-1 font-medium capitalize">{formatHeading(view, cursor)}</p>
        <Input className="w-44" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" aria-label="Buscar compromissos" />
        <div className="flex rounded-lg border border-border p-0.5">
          {(["month", "week", "day", "list"] as const).map((item) => (
            <Button key={item} type="button" size="sm" variant={view === item ? "secondary" : "ghost"} onClick={() => setView(item)}>
              {item === "month" ? "Mês" : item === "week" ? "Semana" : item === "day" ? "Dia" : "Lista"}
            </Button>
          ))}
        </div>
        {toolbar}
      </div>

      {view === "month" ? (
        <div className="overflow-x-auto">
          <div className="grid min-w-[640px] grid-cols-7 border-t border-l border-border">
            {weekdays.map((day) => (
              <div key={day} className="border-r border-b border-border bg-muted/40 px-2 py-1 text-xs font-medium capitalize text-muted-foreground">{day}</div>
            ))}
            {Array.from({ length: 42 }, (_, index) => {
              const day = addDays(startOfWeek(new Date(cursor.getFullYear(), cursor.getMonth(), 1)), index);
              const outside = day.getMonth() !== cursor.getMonth();
              const items = filtered.filter((event) => onDay(event, day));
              return (
                <div key={day.toISOString()} className={cn("min-h-24 border-r border-b border-border p-1", outside && "bg-muted/20 text-muted-foreground", sameDay(day, today) && "bg-primary/5")}>
                  <p className="px-1 text-xs">{day.getDate()}</p>
                  <div className="grid gap-0.5">
                    {items.slice(0, 3).map((event) => <EventChip key={event.id} event={event} onClick={onEventClick} />)}
                    {items.length > 3 ? <p className="px-1 text-[10px] text-muted-foreground">+{items.length - 3}</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === "week" ? (
        <div className="grid grid-cols-1 gap-2 overflow-x-auto md:grid-cols-7">
          {Array.from({ length: 7 }, (_, index) => {
            const day = addDays(startOfWeek(cursor), index);
            const items = filtered.filter((event) => onDay(event, day));
            return (
              <div key={day.toISOString()} className={cn("min-h-40 rounded-lg border border-border p-2", sameDay(day, today) && "border-primary/40")}>
                <p className="text-xs font-medium capitalize text-muted-foreground">{day.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" })}</p>
                <div className="mt-2 grid gap-1">
                  {items.map((event) => <EventChip key={event.id} event={event} onClick={onEventClick} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {view === "day" || view === "list" ? (
        <div className="grid gap-2">
          {(view === "day" ? filtered.filter((event) => onDay(event, cursor)) : [...filtered].sort((a, b) => a.start.localeCompare(b.start))).map((event) => (
            <button
              key={event.id}
              type="button"
              className="flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left hover:border-foreground/20"
              onClick={() => onEventClick?.(event)}
            >
              <span className="mt-1 size-2.5 shrink-0 rounded-sm" style={{ background: event.color }} />
              <span className="min-w-0">
                <span className="block font-medium">{event.title}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(event.start).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  {event.location ? ` · ${event.location}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
