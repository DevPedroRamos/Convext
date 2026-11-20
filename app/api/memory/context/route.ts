import { buildContext } from "@/lib/memory/context-builder";
import { handleMemory, safeRecord } from "@/lib/memory/http";
import { contextSchema } from "@/lib/validations/memory";

// Devolve o contexto pronto para qualquer agente: `prompt.system` e `prompt.messages` já vêm
// no formato da Messages API com os breakpoints de cache no lugar certo.
export function POST(request: Request) {
  return handleMemory(request, contextSchema, async (input, ctx) => {
    const built = await buildContext(ctx, input);
    await safeRecord(ctx.store, {
      project: input.project,
      agent: built.agent,
      operation: "context",
      query: input.task,
      contextTokens: built.stats.contextTokens,
      baselineTokens: built.stats.baselineTokens,
      latencyMs: performance.now() - ctx.startedAt,
      retrieval: { mode: built.retrievalMode, paths: built.sources.map((s) => s.path), prefixHash: built.prefixHash },
      quality: { sourcesSelected: built.sources.length },
    });
    return built;
  });
}
