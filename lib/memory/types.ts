export type DocKind = "spec" | "decision" | "glossary" | "product" | "memory" | "rule" | "note";

export type SourceDocument = { path: string; content: string };

export type ParsedChunk = {
  position: number;
  heading: string;
  content: string;
  tokens: number;
  contentHash: string;
  embedding?: number[] | null;
};

export type ParsedDocument = {
  path: string;
  title: string;
  kind: DocKind;
  tags: string[];
  pinned: boolean;
  frontmatter: Record<string, unknown>;
  body: string;
  content: string;
  contentHash: string;
  tokens: number;
  wikilinks: string[];
  mdLinks: string[];
  codePaths: string[];
};

export type GlossaryEntry = { term: string; definition: string; avoid: string[] };

export type GraphNode = { id: string; kind: string; label: string; props?: Record<string, unknown> };
export type GraphEdge = { src: string; dst: string; relation: string; weight: number };
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };

/** Linha devolvida pela busca do store: o rank em cada lista (null quando fora dela). */
export type SearchHit = {
  chunkId: string;
  documentId: string;
  path: string;
  title: string;
  kind: string;
  heading: string;
  content: string;
  tokens: number;
  position: number;
  lexRank: number | null;
  vecRank: number | null;
};

export type HistoryMessage = { role: "user" | "assistant"; content: string };

export type RunRecord = {
  project: string;
  agent: string;
  operation: "search" | "context" | "ask" | "ingest" | "eval";
  model?: string | null;
  query?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  contextTokens?: number;
  baselineTokens?: number;
  costUsd?: number;
  latencyMs: number;
  retrieval?: Record<string, unknown>;
  quality?: Record<string, unknown>;
  createdAt?: string;
};
