// Datas do financeiro como strings ISO "YYYY-MM-DD", calculadas em UTC para não
// depender do fuso do servidor. Competência = primeiro dia do mês.

export type IsoDate = string;

function parts(date: IsoDate) {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return { y, m, d };
}

function iso(y: number, m: number, d: number): IsoDate {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toISOString().slice(0, 10);
}

export function todayIso(now = new Date()): IsoDate {
  return now.toISOString().slice(0, 10);
}

export function monthStart(date: IsoDate): IsoDate {
  const { y, m } = parts(date);
  return iso(y, m, 1);
}

export function daysInMonth(date: IsoDate) {
  const { y, m } = parts(date);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function monthEnd(date: IsoDate): IsoDate {
  const { y, m } = parts(date);
  return iso(y, m, daysInMonth(date));
}

export function addMonths(date: IsoDate, months: number): IsoDate {
  const { y, m, d } = parts(date);
  const first = iso(y, m + months, 1);
  return iso(parts(first).y, parts(first).m, Math.min(d, daysInMonth(first)));
}

/** Dia `day` no mês de `month`, limitado ao último dia do mês (31 → 28/29/30). */
export function dayInMonth(month: IsoDate, day: number): IsoDate {
  const { y, m } = parts(month);
  return iso(y, m, Math.min(Math.max(day, 1), daysInMonth(month)));
}

/** Últimos `count` meses terminando em `last` (inclusive), em ordem cronológica. */
export function monthRange(last: IsoDate, count: number): IsoDate[] {
  const end = monthStart(last);
  return Array.from({ length: count }, (_, index) => addMonths(end, index - (count - 1)));
}

export function isMonthKey(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** "2026-11" ou "2026-11-20" → "2026-11-01". */
export function parseMonth(value: string | null | undefined, fallback: IsoDate): IsoDate {
  if (!value) return monthStart(fallback);
  if (isMonthKey(value)) return `${value}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return monthStart(value);
  return monthStart(fallback);
}

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" });
const longMonthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export function formatMonthShort(month: IsoDate) {
  return monthFormatter.format(new Date(`${monthStart(month)}T00:00:00Z`)).replace(". de ", "/").replace(" de ", "/");
}

export function formatMonthLong(month: IsoDate) {
  const label = longMonthFormatter.format(new Date(`${monthStart(month)}T00:00:00Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDate(date: IsoDate | null | undefined) {
  if (!date) return "—";
  return dateFormatter.format(new Date(`${date.slice(0, 10)}T00:00:00Z`));
}
