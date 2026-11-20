// Store de produção: Supabase Postgres com pgvector + FTS (migration memory_knowledge_base).
// Acesso apenas com service role, a partir das rotas /api/memory/*.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EntityNode } from "@/lib/memory/graph";
import type { KnowledgeStore } from "@/lib/memory/store";
import type { Graph, GraphEdge, GraphNode, RunRecord, SearchHit } from "@/lib/memory/types";

// As tabelas kb_* entram em types/database.types.ts quando os tipos forem regenerados após a
// migration; até lá o client é usado sem o genérico Database.
type Client = SupabaseClient;

const toVector = (values: number[]) => `[${values.join(",")}]`;
const parseVector = (value: unknown) => (typeof value === "string" ? (JSON.parse(value) as number[]) : (value as number[]));

function chunked<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function check<T>(result: { data: T; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}

export function createSupabaseStore(client: Client): KnowledgeStore {
  async function edgesTouching(project: string, nodeIds: string[]): Promise<GraphEdge[]> {
    if (!nodeIds.length) return [];
    const fetchSide = async (column: "src" | "dst", ids: string[]) =>
      check(await client.from("kb_edges").select("src,dst,relation,weight").eq("project", project).in(column, ids).limit(2000), "kb_edges") as GraphEdge[];
    const ids = new Set(nodeIds);
    const first = (await Promise.all([fetchSide("src", nodeIds), fetchSide("dst", nodeIds)])).flat();
    const hubs = [...new Set(first.flatMap((e) => [e.src, e.dst]))].filter((id) => !ids.has(id) && !id.startsWith("doc:") && !id.startsWith("entity:"));
    if (!hubs.length) return first;
    const second = (await Promise.all([fetchSide("src", hubs.slice(0, 100)), fetchSide("dst", hubs.slice(0, 100))])).flat();
    const seen = new Set<string>();
    return [...first, ...second].filter((edge) => {
      const key = `${edge.src}|${edge.dst}|${edge.relation}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return {
    async search({ project, query, embedding, limit, kinds }) {
      const rows = check(
        await client.rpc("kb_hybrid_search", {
          p_project: project,
          p_query: query,
          p_embedding: embedding ? toVector(embedding) : null,
          p_limit: limit,
          p_kinds: kinds?.length ? kinds : null,
        }),
        "kb_hybrid_search",
      ) as Array<Record<string, unknown>>;
      return rows.map(
        (row): SearchHit => ({
          chunkId: String(row.chunk_id),
          documentId: String(row.document_id),
          path: String(row.path),
          title: String(row.title),
          kind: String(row.kind),
          heading: String(row.heading ?? ""),
          content: String(row.content),
          tokens: Number(row.tokens),
          position: Number(row.chunk_position),
          lexRank: row.lex_rank == null ? null : Number(row.lex_rank),
          vecRank: row.vec_rank == null ? null : Number(row.vec_rank),
        }),
      );
    },
    async entities(project) {
      const rows = check(await client.from("kb_nodes").select("id,label,props").eq("project", project).eq("kind", "entity"), "kb_nodes") as Array<{ id: string; label: string; props: Record<string, unknown> }>;
      return rows.map((row): EntityNode => ({ id: row.id, label: row.label, definition: String(row.props?.definition ?? ""), avoid: (row.props?.avoid as string[]) ?? [] }));
    },
    edgesTouching,
    async neighbors(project, nodeId, depth) {
      const visited = new Set([nodeId]);
      const edges = new Map<string, GraphEdge>();
      let frontier = [nodeId];
      for (let level = 0; level < depth && frontier.length; level += 1) {
        const found = [
          ...(check(await client.from("kb_edges").select("src,dst,relation,weight").eq("project", project).in("src", frontier).limit(500), "kb_edges") as GraphEdge[]),
          ...(check(await client.from("kb_edges").select("src,dst,relation,weight").eq("project", project).in("dst", frontier).limit(500), "kb_edges") as GraphEdge[]),
        ];
        const next: string[] = [];
        for (const edge of found) {
          edges.set(`${edge.src}|${edge.dst}|${edge.relation}`, edge);
          for (const id of [edge.src, edge.dst]) {
            if (visited.has(id)) continue;
            visited.add(id);
            next.push(id);
          }
        }
        frontier = next.slice(0, 200);
      }
      const nodes = check(await client.from("kb_nodes").select("id,kind,label,props").eq("project", project).in("id", [...visited].slice(0, 400)), "kb_nodes") as GraphNode[];
      return { nodes, edges: [...edges.values()] };
    },
    async pinned(project) {
      return check(await client.from("kb_documents").select("path,title,content").eq("project", project).eq("pinned", true).order("path"), "kb_documents") as {
        path: string;
        title: string;
        content: string;
      }[];
    },
    async corpusStats(project) {
      const docs = check(await client.from("kb_documents").select("tokens").eq("project", project), "kb_documents") as { tokens: number }[];
      const { count, error } = await client.from("kb_chunks").select("id", { count: "exact", head: true }).eq("project", project);
      if (error) throw new Error(`kb_chunks: ${error.message}`);
      return { documents: docs.length, chunks: count ?? 0, tokens: docs.reduce((sum, doc) => sum + doc.tokens, 0) };
    },
    async documentHashes(project) {
      const rows = check(await client.from("kb_documents").select("path,content_hash").eq("project", project), "kb_documents") as { path: string; content_hash: string }[];
      return new Map(rows.map((row) => [row.path, row.content_hash]));
    },
    async embeddingsByChunkHash(project, hashes) {
      const found = new Map<string, number[]>();
      for (const group of chunked([...new Set(hashes)], 80)) {
        const rows = check(
          await client.from("kb_chunks").select("content_hash,embedding").eq("project", project).in("content_hash", group).not("embedding", "is", null),
          "kb_chunks",
        ) as { content_hash: string; embedding: unknown }[];
        for (const row of rows) found.set(row.content_hash, parseVector(row.embedding));
      }
      return found;
    },
    async upsertDocument(project, doc, chunks) {
      const saved = check(
        await client
          .from("kb_documents")
          .upsert(
            {
              project,
              path: doc.path,
              title: doc.title,
              kind: doc.kind,
              tags: doc.tags,
              pinned: doc.pinned,
              content: doc.content,
              content_hash: doc.contentHash,
              tokens: doc.tokens,
              meta: { frontmatter: doc.frontmatter, codePaths: doc.codePaths },
              updated_at: new Date().toISOString(),
            },
            { onConflict: "project,path" },
          )
          .select("id")
          .single(),
        "kb_documents",
      ) as { id: string };
      check(await client.from("kb_chunks").delete().eq("document_id", saved.id), "kb_chunks");
      for (const group of chunked(chunks, 100)) {
        check(
          await client.from("kb_chunks").insert(
            group.map((chunk) => ({
              document_id: saved.id,
              project,
              position: chunk.position,
              heading: chunk.heading,
              content: chunk.content,
              content_hash: chunk.contentHash,
              tokens: chunk.tokens,
              embedding: chunk.embedding ? toVector(chunk.embedding) : null,
            })),
          ),
          "kb_chunks",
        );
      }
    },
    async deleteDocuments(project, paths) {
      for (const group of chunked(paths, 100)) check(await client.from("kb_documents").delete().eq("project", project).in("path", group), "kb_documents");
    },
    async listDocuments(project, kind) {
      let query = client.from("kb_documents").select("path,title,kind,content,updated_at").eq("project", project).order("path");
      if (kind) query = query.eq("kind", kind);
      const rows = check(await query, "kb_documents") as { path: string; title: string; kind: string; content: string; updated_at: string }[];
      return rows.map((row) => ({ path: row.path, title: row.title, kind: row.kind, content: row.content, updatedAt: row.updated_at }));
    },
    async writeGraph(project, graph: Graph, { source, replace }) {
      if (replace) {
        check(await client.from("kb_edges").delete().eq("project", project).eq("source", source), "kb_edges");
        check(await client.from("kb_nodes").delete().eq("project", project).eq("source", source), "kb_nodes");
      }
      for (const group of chunked(graph.nodes, 500)) {
        check(
          await client.from("kb_nodes").upsert(group.map((node) => ({ project, id: node.id, kind: node.kind, label: node.label, props: node.props ?? {}, source })), { onConflict: "project,id" }),
          "kb_nodes",
        );
      }
      for (const group of chunked(graph.edges, 500)) {
        check(
          await client
            .from("kb_edges")
            .upsert(group.map((edge) => ({ project, src: edge.src, dst: edge.dst, relation: edge.relation, weight: edge.weight, source })), { onConflict: "project,src,dst,relation" }),
          "kb_edges",
        );
      }
    },
    async recordRun(run: RunRecord) {
      check(
        await client.from("kb_runs").insert({
          project: run.project,
          agent: run.agent,
          operation: run.operation,
          model: run.model ?? null,
          query: run.query?.slice(0, 2000) ?? null,
          input_tokens: run.inputTokens ?? 0,
          output_tokens: run.outputTokens ?? 0,
          cache_read_tokens: run.cacheReadTokens ?? 0,
          cache_write_tokens: run.cacheWriteTokens ?? 0,
          context_tokens: run.contextTokens ?? 0,
          baseline_tokens: run.baselineTokens ?? 0,
          cost_usd: run.costUsd ?? 0,
          latency_ms: Math.round(run.latencyMs),
          retrieval: run.retrieval ?? {},
          quality: run.quality ?? {},
        }),
        "kb_runs",
      );
    },
    async listRuns(project, since, limit) {
      const rows = check(
        await client.from("kb_runs").select("*").eq("project", project).gte("created_at", since).order("created_at", { ascending: false }).limit(limit),
        "kb_runs",
      ) as Array<Record<string, unknown>>;
      return rows.map(
        (row): RunRecord => ({
          project: String(row.project),
          agent: String(row.agent),
          operation: row.operation as RunRecord["operation"],
          model: (row.model as string) ?? null,
          query: (row.query as string) ?? null,
          inputTokens: Number(row.input_tokens),
          outputTokens: Number(row.output_tokens),
          cacheReadTokens: Number(row.cache_read_tokens),
          cacheWriteTokens: Number(row.cache_write_tokens),
          contextTokens: Number(row.context_tokens),
          baselineTokens: Number(row.baseline_tokens),
          costUsd: Number(row.cost_usd),
          latencyMs: Number(row.latency_ms),
          retrieval: row.retrieval as Record<string, unknown>,
          quality: row.quality as Record<string, unknown>,
          createdAt: String(row.created_at),
        }),
      );
    },
    async recordEval(project, mode, config, metrics, cases) {
      check(await client.from("kb_eval_runs").insert({ project, mode, config, metrics, cases }), "kb_eval_runs");
    },
  };
}
