// Ingestão incremental: só documentos com hash novo são rechunkados; embeddings são
// reaproveitados por hash de chunk (editar um parágrafo não reembeda a nota inteira).
import type { Embedder } from "@/lib/memory/embeddings";
import { buildGraph } from "@/lib/memory/graph";
import { chunkMarkdown, parseDocument } from "@/lib/memory/markdown";
import type { KnowledgeStore } from "@/lib/memory/store";
import type { SourceDocument } from "@/lib/memory/types";

export type IngestInput = {
  project: string;
  documents: SourceDocument[];
  pinned?: string[];
  /** Sincronização completa do vault: remove notas ausentes e reconstrói o grafo de documentos. */
  prune?: boolean;
};

export async function ingestDocuments(deps: { store: KnowledgeStore; embedder: Embedder | null }, input: IngestInput) {
  const pinned = new Set(input.pinned ?? []);
  const parsed = await Promise.all(input.documents.map((doc) => parseDocument(doc, pinned.has(doc.path) ? { pinned: true } : {})));
  const existing = await deps.store.documentHashes(input.project);
  const changed = parsed.filter((doc) => existing.get(doc.path) !== doc.contentHash);

  let chunkCount = 0;
  let embedded = 0;
  let reused = 0;
  const warnings: string[] = [];

  for (const doc of changed) {
    const chunks = await chunkMarkdown(doc.body);
    chunkCount += chunks.length;
    if (deps.embedder && chunks.length) {
      const known = await deps.store.embeddingsByChunkHash(input.project, chunks.map((chunk) => chunk.contentHash));
      const missing = chunks.filter((chunk) => !known.has(chunk.contentHash));
      for (const chunk of chunks) chunk.embedding = known.get(chunk.contentHash) ?? null;
      reused += chunks.length - missing.length;
      if (missing.length) {
        try {
          const vectors = await deps.embedder.embed(missing.map((chunk) => `${doc.title}\n${chunk.heading}\n${chunk.content}`));
          missing.forEach((chunk, index) => (chunk.embedding = vectors[index]));
          embedded += missing.length;
        } catch (error) {
          warnings.push(`${doc.path}: embedding falhou (${(error as Error).message}); indexado só para busca textual.`);
        }
      }
    }
    await deps.store.upsertDocument(input.project, doc, chunks);
  }

  const incoming = new Set(parsed.map((doc) => doc.path));
  const removed = input.prune ? [...existing.keys()].filter((path) => !incoming.has(path)) : [];
  if (removed.length) await deps.store.deleteDocuments(input.project, removed);

  const knownEntities = input.prune ? [] : await deps.store.entities(input.project);
  const knownPaths = input.prune ? [] : [...existing.keys()];
  const graph = buildGraph(parsed, knownEntities, knownPaths);
  await deps.store.writeGraph(input.project, graph, { source: "docs", replace: Boolean(input.prune) });

  return {
    received: parsed.length,
    changed: changed.length,
    unchanged: parsed.length - changed.length,
    removed: removed.length,
    chunks: chunkCount,
    embedded,
    reusedEmbeddings: reused,
    embeddings: deps.embedder ? deps.embedder.model : null,
    graph: { nodes: graph.nodes.length, edges: graph.edges.length },
    warnings,
  };
}
