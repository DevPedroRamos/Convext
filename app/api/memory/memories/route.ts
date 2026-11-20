import { z } from "zod";
import { handleMemory } from "@/lib/memory/http";
import { ingestDocuments } from "@/lib/memory/ingest";
import { slugify } from "@/lib/memory/text";
import { memoryNoteSchema } from "@/lib/validations/memory";

/** Lista as memórias registradas (para exportar ao vault Obsidian). */
export function GET(request: Request) {
  return handleMemory(request, z.object({ project: z.string().default("convext") }), async (input, ctx) => ({
    memories: await ctx.store.listDocuments(input.project, "memory"),
  }));
}

/**
 * Registra uma memória durável (decisão, fato, preferência, lição) como nota no formato do
 * vault. Ela entra na busca híbrida e no grafo na mesma hora.
 */
export function POST(request: Request) {
  return handleMemory(request, memoryNoteSchema, async (input, ctx) => {
    const date = new Date().toISOString().slice(0, 10);
    // Mesmo caminho que `scripts/memory.mjs pull` grava no vault: a próxima sincronização não duplica.
    const path = `docs/memorias/${date}-${slugify(input.title)}.md`;
    const frontmatter = [
      "---",
      "kind: memory",
      `type: ${input.type}`,
      `created: ${date}`,
      input.agent ? `agent: ${input.agent}` : null,
      input.tags.length ? `tags: [${input.tags.join(", ")}]` : null,
      "---",
    ]
      .filter(Boolean)
      .join("\n");
    const related = input.related.length ? `\n\nRelacionado: ${input.related.map((item) => `[[${item}]]`).join(", ")}` : "";
    const content = `${frontmatter}\n# ${input.title}\n\n${input.content}${related}\n`;
    const result = await ingestDocuments(ctx, { project: input.project, documents: [{ path, content }] });
    return { path, ...result };
  });
}
