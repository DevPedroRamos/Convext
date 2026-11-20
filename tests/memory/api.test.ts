// Integração das rotas /api/memory/* com o store em memória no lugar do Supabase:
// autenticação, validação, ingestão, busca, contexto, memórias, grafo, avaliação e métricas.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryStore } from "@/lib/memory/store-memory";

const store = createMemoryStore();
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/memory/store-supabase", () => ({ createSupabaseStore: () => store }));

const { POST: ingest } = await import("@/app/api/memory/ingest/route");
const { POST: search } = await import("@/app/api/memory/search/route");
const { POST: context } = await import("@/app/api/memory/context/route");
const { GET: listMemories, POST: remember } = await import("@/app/api/memory/memories/route");
const { GET: neighbors, POST: importGraph } = await import("@/app/api/memory/graph/route");
const { GET: metrics } = await import("@/app/api/memory/metrics/route");
const { POST: evaluate } = await import("@/app/api/memory/eval/route");
const { POST: ask } = await import("@/app/api/memory/ask/route");

const KEY = "test-key";
function request(method: string, route: string, body?: unknown, key = KEY) {
  const url = new URL(`http://localhost/api/memory/${route}`);
  if (method === "GET" && body) for (const [k, v] of Object.entries(body)) url.searchParams.set(k, String(v));
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json", ...(key ? { Authorization: `Bearer ${key}` } : {}) },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
}

const documents = [
  { path: "GLOSSARY.md", content: "# G\n\n**Demanda**:\nPedido interno ligado a um Cliente.\n_Avoid_: ticket\n" },
  { path: "docs/specs/demandas.md", content: "# SPEC — Demandas\n\n## Banco\n\nPrazo em `due_on` e prioridade low | medium | high. Código: `lib/demands.ts`.\n" },
  { path: "docs/adr/0002-visibilidade.md", content: "# Visibilidade\n\n## Decisão\n\nTraffic e creator veem só demandas com `responsible_id = auth.uid()`. [[demandas]]\n" },
];

beforeEach(() => {
  process.env.MEMORY_API_KEYS = KEY;
  delete process.env.CLOUDFLARE_ACCOUNT_ID;
  delete process.env.ANTHROPIC_API_KEY;
});

describe("API de memória", () => {
  it("recusa chave ausente ou errada e entrada inválida", async () => {
    expect((await search(request("POST", "search", { query: "x" }, ""))).status).toBe(401);
    expect((await search(request("POST", "search", { query: "prazo" }, "errada"))).status).toBe(401);
    expect((await search(request("POST", "search", { query: "" }))).status).toBe(400);
    process.env.MEMORY_API_KEYS = "";
    expect((await search(request("POST", "search", { query: "prazo" }))).status).toBe(503);
  });

  it("ingere o vault, busca, monta contexto e registra métricas", async () => {
    const ingested = await (await ingest(request("POST", "ingest", { documents, pinned: ["GLOSSARY.md"], prune: true }))).json();
    expect(ingested).toMatchObject({ received: 3, changed: 3, embeddings: null });

    const again = await (await ingest(request("POST", "ingest", { documents, pinned: ["GLOSSARY.md"], prune: true }))).json();
    expect(again).toMatchObject({ changed: 0, unchanged: 3 });

    const found = await (await search(request("POST", "search", { query: "prazo da demanda", k: 3 }))).json();
    expect(found.mode).toBe("lexical");
    expect(found.results[0].path).toBe("docs/specs/demandas.md");

    const built = await (await context(request("POST", "context", { task: "quem vê as demandas?", agent: "review" }))).json();
    expect(built.sources.map((s: { path: string }) => s.path)).toContain("docs/adr/0002-visibilidade.md");
    expect(built.prompt.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(built.stats.contextTokens).toBeGreaterThan(0);

    const summary = await (await metrics(request("GET", "metrics", { days: 1 }))).json();
    expect(summary.byOperation.context.runs).toBe(1);
    expect(summary.byOperation.search.runs).toBe(1);
    expect(summary.byOperation.ingest.runs).toBe(2);
  });

  it("registra memória como nota do vault e a recupera na hora", async () => {
    const saved = await (
      await remember(request("POST", "memories", { title: "Prioridade urgente descartada", content: "Decidimos não criar prioridade urgente; high cobre o caso.", type: "decision", related: ["demandas"] }))
    ).json();
    expect(saved.path).toMatch(/^docs\/memorias\/\d{4}-\d{2}-\d{2}-prioridade-urgente-descartada\.md$/);

    const { memories } = await (await listMemories(request("GET", "memories"))).json();
    expect(memories[0].content).toContain("type: decision");

    const built = await (await context(request("POST", "context", { task: "existe prioridade urgente?" }))).json();
    expect(built.sources[0].path).toBe(saved.path);

    const graph = await (await neighbors(request("GET", "graph", { node: `doc:${saved.path}` }))).json();
    expect(graph.edges.some((e: { dst: string }) => e.dst === "doc:docs/specs/demandas.md")).toBe(true);
  });

  it("importa o grafo do Graphify sem apagar o grafo dos documentos", async () => {
    const result = await (
      await importGraph(request("POST", "graph", { graph: { nodes: [{ id: "fn", label: "listDemands", source_file: "lib/demands.ts" }], links: [] } }))
    ).json();
    expect(result).toEqual({ nodes: 2, edges: 1 });
    const graph = await (await neighbors(request("GET", "graph", { node: "file:lib/demands.ts" }))).json();
    const linked = graph.edges.map((e: { src: string }) => e.src);
    expect(linked).toEqual(expect.arrayContaining(["gfy:fn", "doc:docs/specs/demandas.md"]));
  });

  it("avalia recuperação por variante e recusa o modo answer sem chave do modelo", async () => {
    const cases = [{ id: "prazo", query: "onde fica o prazo da demanda?", relevant: ["docs/specs/demandas.md"] }];
    const report = await (await evaluate(request("POST", "eval", { cases }))).json();
    expect(report.variants.map((v: { variant: string }) => v.variant)).toEqual(["hybrid+graph", "hybrid"]);
    expect(report.variants[0].metrics["recall@5"]).toBe(1);
    expect((await evaluate(request("POST", "eval", { mode: "answer", cases }))).status).toBe(503);
    expect((await ask(request("POST", "ask", { task: "prazo?" }))).status).toBe(503);
  });
});
