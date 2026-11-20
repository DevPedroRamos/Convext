import type { EntityNode } from "@/lib/memory/graph";
import type { Graph, GraphEdge, ParsedChunk, ParsedDocument, RunRecord, SearchHit } from "@/lib/memory/types";

/**
 * Fronteira de persistência da memória. Duas implementações:
 * - Supabase (produção, pgvector + FTS) em store-supabase.ts;
 * - memória (benchmark offline e testes) em store-memory.ts.
 */
export interface KnowledgeStore {
  search(params: { project: string; query: string; embedding: number[] | null; limit: number; kinds?: string[] }): Promise<SearchHit[]>;
  entities(project: string): Promise<EntityNode[]>;
  edgesTouching(project: string, nodeIds: string[]): Promise<GraphEdge[]>;
  neighbors(project: string, nodeId: string, depth: number): Promise<Graph>;
  pinned(project: string): Promise<{ path: string; title: string; content: string }[]>;
  corpusStats(project: string): Promise<{ documents: number; chunks: number; tokens: number }>;
  documentHashes(project: string): Promise<Map<string, string>>;
  embeddingsByChunkHash(project: string, hashes: string[]): Promise<Map<string, number[]>>;
  upsertDocument(project: string, doc: ParsedDocument, chunks: ParsedChunk[]): Promise<void>;
  deleteDocuments(project: string, paths: string[]): Promise<void>;
  listDocuments(project: string, kind?: string): Promise<{ path: string; title: string; kind: string; content: string; updatedAt: string }[]>;
  writeGraph(project: string, graph: Graph, options: { source: string; replace: boolean }): Promise<void>;
  recordRun(run: RunRecord): Promise<void>;
  listRuns(project: string, since: string, limit: number): Promise<RunRecord[]>;
  recordEval(project: string, mode: string, config: unknown, metrics: unknown, cases: unknown): Promise<void>;
}
