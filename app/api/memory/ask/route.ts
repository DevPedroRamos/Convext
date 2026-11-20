import { buildContext } from "@/lib/memory/context-builder";
import { answerMetrics } from "@/lib/memory/evaluation";
import { handleMemory, MemoryHttpError, safeRecord } from "@/lib/memory/http";
import { askWithContext, hasLlmEnv } from "@/lib/memory/llm";
import { askSchema } from "@/lib/validations/memory";

export function POST(request: Request) {
  return handleMemory(request, askSchema, async (input, ctx) => {
    if (!hasLlmEnv()) throw new MemoryHttpError(503, "NOT_CONFIGURED", "ANTHROPIC_API_KEY não configurada.");
    const built = await buildContext(ctx, input);
    const contextMs = performance.now() - ctx.startedAt;
    const result = await askWithContext(built, { model: input.model, effort: input.effort, maxTokens: input.maxTokens });
    const quality = answerMetrics(result.answer, input.mustInclude ?? [], result.citations);
    await safeRecord(ctx.store, {
      project: input.project,
      agent: built.agent,
      operation: "ask",
      model: result.model,
      query: input.task,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      cacheReadTokens: result.usage.cacheReadTokens,
      cacheWriteTokens: result.usage.cacheWriteTokens,
      contextTokens: built.stats.contextTokens,
      baselineTokens: built.stats.baselineTokens,
      costUsd: result.costUsd,
      latencyMs: performance.now() - ctx.startedAt,
      retrieval: { mode: built.retrievalMode, paths: built.sources.map((s) => s.path), contextMs: Math.round(contextMs), prefixHash: built.prefixHash },
      quality: { ...quality, sourcesSelected: built.sources.length, refused: result.refused },
    });
    return {
      answer: result.answer,
      model: result.model,
      stopReason: result.stopReason,
      sources: built.sources,
      citations: result.citations,
      usage: result.usage,
      costUsd: result.costUsd,
      costWithoutCacheUsd: result.costWithoutCacheUsd,
      stats: built.stats,
      quality,
      latencyMs: Math.round(performance.now() - ctx.startedAt),
    };
  });
}
