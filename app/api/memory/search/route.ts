import { handleMemory, safeRecord } from "@/lib/memory/http";
import { fuseRrf, selectCandidates } from "@/lib/memory/retrieval";
import { searchSchema } from "@/lib/validations/memory";

export function POST(request: Request) {
  return handleMemory(request, searchSchema, async (input, ctx) => {
    let embedding: number[] | null = null;
    const warnings: string[] = [];
    if (ctx.embedder) {
      try {
        embedding = await ctx.embedder.embedQuery(input.query);
      } catch (error) {
        warnings.push(`embedding indisponível: ${(error as Error).message}`);
      }
    }
    const hits = await ctx.store.search({ project: input.project, query: input.query, embedding, limit: input.k * 3, kinds: input.kinds });
    const results = selectCandidates(fuseRrf(hits), { minRelative: 0 }).slice(0, input.k).map((candidate) => ({
      path: candidate.path,
      title: candidate.title,
      kind: candidate.kind,
      heading: candidate.heading,
      score: Number(candidate.score.toFixed(5)),
      reasons: candidate.reasons,
      tokens: candidate.tokens,
      content: candidate.content,
    }));
    await safeRecord(ctx.store, {
      project: input.project,
      agent: "search",
      operation: "search",
      query: input.query,
      latencyMs: performance.now() - ctx.startedAt,
      retrieval: { mode: embedding ? "hybrid" : "lexical", results: results.length, paths: results.map((r) => r.path) },
    });
    return { mode: embedding ? "hybrid" : "lexical", results, warnings };
  });
}
