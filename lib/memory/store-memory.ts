// Store em memória: BM25 + cosseno + grafo. Usado pelo benchmark offline (prova de ganho
// sem banco nem credenciais) e pelos testes. Mesma interface do store Supabase.
import type { EntityNode } from "@/lib/memory/graph";
import type { KnowledgeStore } from "@/lib/memory/store";
import { terms } from "@/lib/memory/text";
import type { Graph, GraphEdge, GraphNode, ParsedChunk, ParsedDocument, RunRecord, SearchHit } from "@/lib/memory/types";

type StoredChunk = ParsedChunk & { id: string; documentId: string; termFreq: Map<string, number>; length: number };
type StoredDoc = { id: string; doc: ParsedDocument; chunks: StoredChunk[]; updatedAt: string };
type ProjectState = { docs: Map<string, StoredDoc>; nodes: Map<string, GraphNode & { source: string }>; edges: Map<string, GraphEdge & { source: string }>; runs: RunRecord[]; evals: unknown[] };

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

export function createMemoryStore(): KnowledgeStore & { state: (project: string) => ProjectState } {
  const projects = new Map<string, ProjectState>();
  let sequence = 0;
  const state = (project: string) => {
    let current = projects.get(project);
    if (!current) {
      current = { docs: new Map(), nodes: new Map(), edges: new Map(), runs: [], evals: [] };
      projects.set(project, current);
    }
    return current;
  };
  const allChunks = (project: string, kinds?: string[]) =>
    [...state(project).docs.values()].filter((d) => !kinds?.length || kinds.includes(d.doc.kind)).flatMap((d) => d.chunks.map((chunk) => ({ chunk, doc: d })));

  return {
    state,
    async search({ project, query, embedding, limit, kinds }) {
      const rows = allChunks(project, kinds);
      const queryTerms = [...new Set(terms(query))];
      const avgLength = rows.reduce((sum, row) => sum + row.chunk.length, 0) / Math.max(1, rows.length);
      const df = new Map<string, number>();
      for (const term of queryTerms) df.set(term, rows.filter((row) => row.chunk.termFreq.has(term)).length);
      const lexical = rows
        .map((row) => {
          let score = 0;
          for (const term of queryTerms) {
            const tf = row.chunk.termFreq.get(term) ?? 0;
            if (!tf) continue;
            const idf = Math.log(1 + (rows.length - df.get(term)! + 0.5) / (df.get(term)! + 0.5));
            score += idf * ((tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (row.chunk.length / avgLength))));
          }
          return { row, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      const vector = embedding
        ? rows
            .filter((row) => row.chunk.embedding)
            .map((row) => ({ row, score: cosine(embedding, row.chunk.embedding!) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
        : [];
      const hits = new Map<string, SearchHit>();
      const toHit = (row: (typeof rows)[number]): SearchHit => ({
        chunkId: row.chunk.id,
        documentId: row.doc.id,
        path: row.doc.doc.path,
        title: row.doc.doc.title,
        kind: row.doc.doc.kind,
        heading: row.chunk.heading,
        content: row.chunk.content,
        tokens: row.chunk.tokens,
        position: row.chunk.position,
        lexRank: null,
        vecRank: null,
      });
      lexical.forEach((item, index) => {
        const hit = hits.get(item.row.chunk.id) ?? toHit(item.row);
        hit.lexRank = index + 1;
        hits.set(item.row.chunk.id, hit);
      });
      vector.forEach((item, index) => {
        const hit = hits.get(item.row.chunk.id) ?? toHit(item.row);
        hit.vecRank = index + 1;
        hits.set(item.row.chunk.id, hit);
      });
      return [...hits.values()];
    },
    async entities(project) {
      return [...state(project).nodes.values()]
        .filter((node) => node.kind === "entity")
        .map((node): EntityNode => ({ id: node.id, label: node.label, definition: String(node.props?.definition ?? ""), avoid: (node.props?.avoid as string[]) ?? [] }));
    },
    async edgesTouching(project, nodeIds) {
      const ids = new Set(nodeIds);
      const first = [...state(project).edges.values()].filter((edge) => ids.has(edge.src) || ids.has(edge.dst));
      const hubs = new Set(first.flatMap((edge) => [edge.src, edge.dst]).filter((id) => !ids.has(id) && !id.startsWith("doc:") && !id.startsWith("entity:")));
      const second = [...state(project).edges.values()].filter((edge) => (hubs.has(edge.src) || hubs.has(edge.dst)) && !first.includes(edge));
      return [...first, ...second];
    },
    async neighbors(project, nodeId, depth) {
      const current = state(project);
      const visited = new Set([nodeId]);
      const edges: GraphEdge[] = [];
      let frontier = [nodeId];
      for (let level = 0; level < depth; level += 1) {
        const next: string[] = [];
        for (const edge of current.edges.values()) {
          for (const [from, to] of [[edge.src, edge.dst], [edge.dst, edge.src]]) {
            if (!frontier.includes(from)) continue;
            edges.push(edge);
            if (!visited.has(to)) {
              visited.add(to);
              next.push(to);
            }
          }
        }
        frontier = next;
      }
      return { nodes: [...visited].map((id) => current.nodes.get(id)).filter(Boolean) as GraphNode[], edges: [...new Set(edges)] };
    },
    async pinned(project) {
      return [...state(project).docs.values()].filter((d) => d.doc.pinned).map((d) => ({ path: d.doc.path, title: d.doc.title, content: d.doc.content }));
    },
    async corpusStats(project) {
      const docs = [...state(project).docs.values()];
      return { documents: docs.length, chunks: docs.reduce((s, d) => s + d.chunks.length, 0), tokens: docs.reduce((s, d) => s + d.doc.tokens, 0) };
    },
    async documentHashes(project) {
      return new Map([...state(project).docs.values()].map((d) => [d.doc.path, d.doc.contentHash]));
    },
    async embeddingsByChunkHash(project, hashes) {
      const wanted = new Set(hashes);
      const found = new Map<string, number[]>();
      for (const { chunk } of allChunks(project)) if (wanted.has(chunk.contentHash) && chunk.embedding) found.set(chunk.contentHash, chunk.embedding);
      return found;
    },
    async upsertDocument(project, doc, chunks) {
      const id = state(project).docs.get(doc.path)?.id ?? `doc-${(sequence += 1)}`;
      state(project).docs.set(doc.path, {
        id,
        doc,
        updatedAt: new Date().toISOString(),
        chunks: chunks.map((chunk) => {
          const list = terms(`${chunk.heading} ${chunk.heading} ${chunk.content}`);
          const termFreq = new Map<string, number>();
          for (const term of list) termFreq.set(term, (termFreq.get(term) ?? 0) + 1);
          return { ...chunk, id: `${id}:${chunk.position}`, documentId: id, termFreq, length: list.length };
        }),
      });
    },
    async deleteDocuments(project, paths) {
      for (const path of paths) state(project).docs.delete(path);
    },
    async listDocuments(project, kind) {
      return [...state(project).docs.values()]
        .filter((d) => !kind || d.doc.kind === kind)
        .map((d) => ({ path: d.doc.path, title: d.doc.title, kind: d.doc.kind, content: d.doc.content, updatedAt: d.updatedAt }));
    },
    async writeGraph(project, graph: Graph, { source, replace }) {
      const current = state(project);
      if (replace) {
        for (const [key, node] of current.nodes) if (node.source === source) current.nodes.delete(key);
        for (const [key, edge] of current.edges) if (edge.source === source) current.edges.delete(key);
      }
      for (const node of graph.nodes) current.nodes.set(node.id, { ...node, source });
      for (const edge of graph.edges) current.edges.set(`${edge.src}|${edge.dst}|${edge.relation}`, { ...edge, source });
    },
    async recordRun(run) {
      state(run.project).runs.push({ ...run, createdAt: run.createdAt ?? new Date().toISOString() });
    },
    async listRuns(project, since, limit) {
      return state(project).runs.filter((run) => (run.createdAt ?? "") >= since).slice(-limit);
    },
    async recordEval(project, mode, config, metrics, cases) {
      state(project).evals.push({ mode, config, metrics, cases });
    },
  };
}
