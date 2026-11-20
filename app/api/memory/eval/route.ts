import { buildContext } from "@/lib/memory/context-builder";
import { answerMetrics, retrievalMetrics, runRetrievalEval } from "@/lib/memory/evaluation";
import { handleMemory, MemoryHttpError, safeRecord } from "@/lib/memory/http";
import { askWithContext, hasLlmEnv } from "@/lib/memory/llm";
import { evalSchema } from "@/lib/validations/memory";

export function POST(request: Request) {
  return handleMemory(request, evalSchema, async (input, ctx) => {
    if (input.mode === "retrieval") {
      const report = await runRetrievalEval(ctx, input.project, input.cases, { k: input.k });
      await ctx.store.recordEval(input.project, "retrieval", { k: input.k }, report.variants.map((v) => ({ variant: v.variant, ...v.metrics })), report.variants);
      return report;
    }

    // Modo answer: chama o modelo — custa tokens reais; use um conjunto pequeno.
    if (!hasLlmEnv()) throw new MemoryHttpError(503, "NOT_CONFIGURED", "ANTHROPIC_API_KEY não configurada.");
    type CaseResult = ReturnType<typeof retrievalMetrics> &
      ReturnType<typeof answerMetrics> & { id: string; costUsd: number; usage: { cacheReadTokens: number }; latencyMs: number };
    const cases: CaseResult[] = [];
    for (const testCase of input.cases) {
      const started = performance.now();
      const built = await buildContext(ctx, { project: input.project, agent: testCase.agent, task: testCase.query });
      const result = await askWithContext(built, { model: input.model });
      const quality = answerMetrics(result.answer, testCase.mustInclude ?? [], result.citations);
      const retrieval = retrievalMetrics(built.sources.map((s) => s.path), testCase.relevant, input.k);
      const latencyMs = performance.now() - started;
      await safeRecord(ctx.store, {
        project: input.project,
        agent: built.agent,
        operation: "eval",
        model: result.model,
        query: testCase.query,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        cacheReadTokens: result.usage.cacheReadTokens,
        cacheWriteTokens: result.usage.cacheWriteTokens,
        contextTokens: built.stats.contextTokens,
        baselineTokens: built.stats.baselineTokens,
        costUsd: result.costUsd,
        latencyMs,
        retrieval,
        quality,
      });
      cases.push({ id: testCase.id, ...retrieval, ...quality, costUsd: result.costUsd, usage: result.usage, latencyMs: Math.round(latencyMs) });
    }
    const mean = (pick: (c: CaseResult) => number) => Number((cases.reduce((s, c) => s + pick(c), 0) / cases.length).toFixed(4));
    const metrics = {
      factCoverage: mean((c) => c.factCoverage),
      citationValidity: mean((c) => c.citationValidity),
      recall: mean((c) => c.recall),
      costUsd: Number(cases.reduce((s, c) => s + c.costUsd, 0).toFixed(6)),
      avgLatencyMs: Math.round(mean((c) => c.latencyMs)),
      cacheReadTokens: cases.reduce((s, c) => s + c.usage.cacheReadTokens, 0),
    };
    await ctx.store.recordEval(input.project, "answer", { k: input.k, model: input.model }, metrics, cases);
    return { metrics, cases };
  });
}
