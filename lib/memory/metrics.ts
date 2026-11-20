// Agregação das execuções registradas em kb_runs: tokens, custo, latência, cache e economia
// de contexto versus enviar toda a documentação.
import { costWithoutCacheUsd } from "@/lib/memory/pricing";
import type { RunRecord } from "@/lib/memory/types";

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

const round = (value: number, digits = 4) => Number(value.toFixed(digits));

function summarize(runs: RunRecord[]) {
  const latencies = runs.map((run) => run.latencyMs).sort((a, b) => a - b);
  const sum = (pick: (run: RunRecord) => number | undefined) => runs.reduce((total, run) => total + (pick(run) ?? 0), 0);
  const input = sum((r) => r.inputTokens);
  const cacheRead = sum((r) => r.cacheReadTokens);
  const cacheWrite = sum((r) => r.cacheWriteTokens);
  const context = sum((r) => r.contextTokens);
  const baseline = sum((r) => r.baselineTokens);
  const cost = sum((r) => r.costUsd);
  const llmRuns = runs.filter((run) => run.model);
  const uncachedCost = llmRuns.reduce(
    (total, run) =>
      total +
      costWithoutCacheUsd(run.model!, {
        inputTokens: run.inputTokens ?? 0,
        outputTokens: run.outputTokens ?? 0,
        cacheReadTokens: run.cacheReadTokens ?? 0,
        cacheWriteTokens: run.cacheWriteTokens ?? 0,
      }),
    0,
  );
  const quality = runs.map((run) => run.quality ?? {});
  const avgOf = (key: string) => {
    const values = quality.map((q) => q[key]).filter((v): v is number => typeof v === "number");
    return values.length ? round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  };
  const estimationErrors = llmRuns
    .filter((run) => run.contextTokens && run.inputTokens !== undefined)
    .map((run) => {
      const real = (run.inputTokens ?? 0) + (run.cacheReadTokens ?? 0) + (run.cacheWriteTokens ?? 0);
      return real ? Math.abs(run.contextTokens! - real) / real : 0;
    });

  return {
    runs: runs.length,
    latencyMs: { avg: runs.length ? Math.round(sum((r) => r.latencyMs) / runs.length) : 0, p50: percentile(latencies, 50), p95: percentile(latencies, 95) },
    tokens: { input, output: sum((r) => r.outputTokens), cacheRead, cacheWrite, context, baseline },
    contextSavingsPct: baseline ? round(1 - context / baseline) : 0,
    avgContextTokens: runs.length ? Math.round(context / runs.length) : 0,
    avgBaselineTokens: runs.length ? Math.round(baseline / runs.length) : 0,
    cacheHitRate: input + cacheRead + cacheWrite ? round(cacheRead / (input + cacheRead + cacheWrite)) : 0,
    costUsd: round(cost, 6),
    costPerRunUsd: llmRuns.length ? round(cost / llmRuns.length, 6) : 0,
    cacheSavingsUsd: round(Math.max(0, uncachedCost - cost), 6),
    tokenEstimateErrorPct: estimationErrors.length ? round(estimationErrors.reduce((a, b) => a + b, 0) / estimationErrors.length) : null,
    quality: {
      factCoverage: avgOf("factCoverage"),
      citationValidity: avgOf("citationValidity"),
      sourcesSelected: avgOf("sourcesSelected"),
    },
  };
}

export function summarizeRuns(runs: RunRecord[]) {
  const byOperation: Record<string, ReturnType<typeof summarize>> = {};
  const byAgent: Record<string, ReturnType<typeof summarize>> = {};
  for (const key of new Set(runs.map((r) => r.operation))) byOperation[key] = summarize(runs.filter((r) => r.operation === key));
  for (const key of new Set(runs.map((r) => r.agent))) byAgent[key] = summarize(runs.filter((r) => r.agent === key));
  return { overall: summarize(runs), byOperation, byAgent };
}
