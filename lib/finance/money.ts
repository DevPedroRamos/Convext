// Valores monetários trafegam em centavos (inteiros). Formulários usam reais.

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlCompact = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });

export function formatCents(cents: number | null | undefined) {
  return brl.format((cents ?? 0) / 100);
}

export function formatCentsCompact(cents: number | null | undefined) {
  return brlCompact.format((cents ?? 0) / 100);
}

export function reaisToCents(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.round(value * 100);
}

export function centsToReais(cents: number | null | undefined) {
  return (cents ?? 0) / 100;
}

/** Divide `total` em `parts` parcelas inteiras; a última absorve o resto. */
export function splitCents(total: number, parts: number) {
  const count = Math.max(1, Math.floor(parts));
  const base = Math.floor(total / count);
  return Array.from({ length: count }, (_, index) => (index === count - 1 ? total - base * (count - 1) : base));
}

export function percentOf(cents: number, percent: number | null | undefined) {
  if (!percent) return 0;
  return Math.round((cents * percent) / 100);
}

export function percent(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}
