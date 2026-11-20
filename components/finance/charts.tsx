"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCents, formatCentsCompact } from "@/lib/finance/money";

// Paleta validada (scripts do guia de dataviz) contra a superfície do card (#151515), modo escuro.
// Série única usa o laranja da marca; três séries usam os slots categóricos 1–3 em ordem fixa.
const SINGLE = "#f35703";
const SERIES = ["#3987e5", "#d95926", "#199e70"] as const;
const GRID = "rgba(255,255,255,0.06)";
const AXIS = "#898989";

const axisProps = { stroke: AXIS, tick: { fill: AXIS, fontSize: 12 }, tickLine: false, axisLine: false } as const;

type TooltipRow = { name: string; value: number; color?: string };

function TooltipBox({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-foreground">{title}</p>
      {rows.map((row) => (
        <p key={row.name} className="flex items-center gap-2 text-muted-foreground">
          {row.color ? <span className="inline-block size-2 rounded-full" style={{ background: row.color }} /> : null}
          <span>{row.name}</span>
          <span className="ml-auto pl-3 tabular-nums text-foreground">{formatCents(row.value)}</span>
        </p>
      ))}
    </div>
  );
}

function SrTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="sr-only">
    <table>
      <caption>{caption}</caption>
      <thead>
        <tr>{head.map((cell) => <th key={cell}>{cell}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

export function MrrChart({ data }: { data: { label: string; mrrCents: number }[] }) {
  return (
    <figure className="grid gap-2">
      <div className="h-64" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="mrr-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SINGLE} stopOpacity={0.28} />
                <stop offset="100%" stopColor={SINGLE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} width={72} tickFormatter={(value: number) => formatCentsCompact(value)} />
            <Tooltip
              cursor={{ stroke: AXIS, strokeDasharray: "3 3" }}
              content={({ active, payload, label }) =>
                active && payload?.length ? <TooltipBox title={String(label)} rows={[{ name: "MRR", value: Number(payload[0].value) }]} /> : null
              }
            />
            <Area type="monotone" dataKey="mrrCents" name="MRR" stroke={SINGLE} strokeWidth={2} fill="url(#mrr-fill)" activeDot={{ r: 5, stroke: "#151515", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <SrTable caption="MRR por mês" head={["Mês", "MRR"]} rows={data.map((point) => [point.label, formatCents(point.mrrCents)])} />
    </figure>
  );
}

export function FunnelChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <figure className="grid gap-2">
      <div className="h-64" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 0 }} barCategoryGap={8}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis type="category" dataKey="label" {...axisProps} width={96} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                    <p className="font-medium text-foreground">{String(label)}</p>
                    <p className="text-muted-foreground"><span className="tabular-nums text-foreground">{Number(payload[0].value)}</span> lead(s)</p>
                  </div>
                ) : null
              }
            />
            <Bar dataKey="count" name="Leads" fill={SINGLE} radius={[0, 4, 4, 0]} maxBarSize={28}>
              <LabelList dataKey="count" position="right" fill="#e5e5e5" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <SrTable caption="Funil de leads" head={["Etapa", "Leads"]} rows={data.map((stage) => [stage.label, stage.count])} />
    </figure>
  );
}

const cashflowSeries = [
  { key: "revenueCents", name: "Receitas", color: SERIES[0] },
  { key: "payrollCents", name: "Folha", color: SERIES[1] },
  { key: "expensesCents", name: "Despesas", color: SERIES[2] },
] as const;

export function CashflowChart({ data }: { data: { label: string; revenueCents: number; payrollCents: number; expensesCents: number; resultCents: number }[] }) {
  return (
    <figure className="grid gap-3">
      <figcaption className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {cashflowSeries.map((series) => (
          <span key={series.key} className="flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-sm" style={{ background: series.color }} /> {series.name}
          </span>
        ))}
      </figcaption>
      <div className="h-72" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2} barCategoryGap="22%">
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} width={72} tickFormatter={(value: number) => formatCentsCompact(value)} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as (typeof data)[number];
                return (
                  <TooltipBox
                    title={String(label)}
                    rows={[
                      ...cashflowSeries.map((series) => ({ name: series.name, value: point[series.key], color: series.color })),
                      { name: "Resultado", value: point.resultCents },
                    ]}
                  />
                );
              }}
            />
            {cashflowSeries.map((series) => (
              <Bar key={series.key} dataKey={series.key} name={series.name} fill={series.color} radius={[4, 4, 0, 0]} maxBarSize={18} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <SrTable
        caption="Fluxo de caixa por mês"
        head={["Mês", "Receitas", "Folha", "Despesas", "Resultado"]}
        rows={data.map((point) => [point.label, formatCents(point.revenueCents), formatCents(point.payrollCents), formatCents(point.expensesCents), formatCents(point.resultCents)])}
      />
    </figure>
  );
}
