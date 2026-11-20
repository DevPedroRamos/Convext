import { handleMemory, safeRecord } from "@/lib/memory/http";
import { ingestDocuments } from "@/lib/memory/ingest";
import { ingestSchema } from "@/lib/validations/memory";

export function POST(request: Request) {
  return handleMemory(request, ingestSchema, async (input, ctx) => {
    const result = await ingestDocuments(ctx, input);
    await safeRecord(ctx.store, {
      project: input.project,
      agent: "sync",
      operation: "ingest",
      latencyMs: performance.now() - ctx.startedAt,
      retrieval: { changed: result.changed, embedded: result.embedded, reusedEmbeddings: result.reusedEmbeddings },
    });
    return result;
  });
}
