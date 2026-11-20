import { describe, expect, it, vi } from "vitest";
import { buildContext, selectHistory } from "@/lib/memory/context-builder";
import { createWorkersAiEmbedder, withQueryCache, type Embedder } from "@/lib/memory/embeddings";
import { answerMetrics, retrievalMetrics } from "@/lib/memory/evaluation";
import { buildGraph, parseGraphify, relatedDocumentWeights } from "@/lib/memory/graph";
import { isAuthorized } from "@/lib/memory/http";
import { ingestDocuments } from "@/lib/memory/ingest";
import { extractCitations } from "@/lib/memory/llm";
import { chunkMarkdown, extractCodePaths, extractMarkdownLinks, extractWikilinks, parseDocument, parseFrontmatter, parseGlossary } from "@/lib/memory/markdown";
import { summarizeRuns } from "@/lib/memory/metrics";
import { costUsd, costWithoutCacheUsd } from "@/lib/memory/pricing";
import { resolveProfile } from "@/lib/memory/profiles";
import { fuseRrf, packWithinBudget, selectCandidates } from "@/lib/memory/retrieval";
import { createMemoryStore } from "@/lib/memory/store-memory";
import { estimateTokens, terms } from "@/lib/memory/text";
import type { SearchHit } from "@/lib/memory/types";

const glossary = `# Convext

**Cliente**:
Contato comercial cadastrado no admin.
_Avoid_: Case, customer

**Demanda**:
Pedido interno ligado a um Cliente, classificado por tipo.
_Avoid_: ticket, task
`;

const corpus = [
  { path: "GLOSSARY.md", content: glossary },
  {
    path: "docs/adr/0002-visibilidade.md",
    content: "# Visibilidade de demandas\n\n## Decisão\n\nRLS em `demands`: operação vê tudo; os demais só quando `responsible_id = auth.uid()`. Ver [[demandas]].\n",
  },
  {
    path: "docs/specs/demandas.md",
    content:
      "---\ntags: [quadro, demanda]\n---\n# SPEC — Demandas\n\n## Escopo\n\nKanban de Demanda com status e prazo `due_on`. Código em `lib/demands.ts`.\n\n## Banco\n\nColuna priority low | medium | high.\n",
  },
  { path: "docs/specs/cases.md", content: "# SPEC — Cases\n\n## Escopo\n\nCard na home com logo e slug. Página aceita uuid ou slug.\n" },
];

function hit(overrides: Partial<SearchHit>): SearchHit {
  return {
    chunkId: overrides.chunkId ?? Math.random().toString(36),
    documentId: "d",
    path: "docs/a.md",
    title: "A",
    kind: "spec",
    heading: "",
    content: "conteúdo",
    tokens: 50,
    position: 0,
    lexRank: null,
    vecRank: null,
    ...overrides,
  };
}

describe("markdown do vault", () => {
  it("lê frontmatter com listas inline e em bloco", () => {
    const { data, body } = parseFrontmatter("---\ntags: [a, b]\nrelated:\n  - x\n  - y\nmemory: pinned\n---\n# T\n");
    expect(data).toEqual({ tags: ["a", "b"], related: ["x", "y"], memory: "pinned" });
    expect(body).toBe("# T\n");
  });

  it("extrai wikilinks, links markdown relativos e caminhos de código", () => {
    expect(extractWikilinks("ver [[demandas|quadro]] e [[cases#Banco]]")).toEqual(["demandas", "cases"]);
    expect(extractMarkdownLinks("[x](../adr/0001.md#c) [y](https://a.com/b.md)", "docs/specs/a.md")).toEqual(["docs/adr/0001.md"]);
    expect(extractCodePaths("rota `app/api/demandas/route.ts` e lib/demands.ts.")).toEqual(["app/api/demandas/route.ts", "lib/demands.ts"]);
  });

  it("lê o glossário no formato da skill domain-modeling", () => {
    expect(parseGlossary(glossary)).toEqual([
      { term: "Cliente", definition: "Contato comercial cadastrado no admin.", avoid: ["Case", "customer"] },
      { term: "Demanda", definition: "Pedido interno ligado a um Cliente, classificado por tipo.", avoid: ["ticket", "task"] },
    ]);
  });

  it("divide por seção com breadcrumb, ignora # dentro de código e respeita o limite", async () => {
    const long = Array.from({ length: 40 }, (_, i) => `Parágrafo ${i} com texto suficiente para ocupar espaço no chunk.`).join("\n\n");
    const chunks = await chunkMarkdown(`# Spec\n\n## Banco\n\n\`\`\`sql\n# não é título\n\`\`\`\n\n${long}\n\n## Riscos\n\nPoucos.`, { maxTokens: 200 });
    expect(chunks.every((chunk) => chunk.tokens <= 220)).toBe(true);
    expect(chunks.some((chunk) => chunk.heading === "Spec > Banco")).toBe(true);
    expect(chunks.some((chunk) => chunk.heading.includes("não é título"))).toBe(false);
    expect(new Set(chunks.map((chunk) => chunk.contentHash)).size).toBe(chunks.length);
  });

  it("une seções pequenas vizinhas para não repetir cabeçalhos", async () => {
    const chunks = await chunkMarkdown("# T\n\n## A\n\num.\n\n## B\n\ndois.\n\n## C\n\ntrês.");
    expect(chunks).toHaveLength(1);
  });
});

describe("grafo de conhecimento", () => {
  it("liga documentos, decisões, entidades do glossário, tags e arquivos", async () => {
    const docs = await Promise.all(corpus.map((doc) => parseDocument(doc)));
    const graph = buildGraph(docs);
    const has = (src: string, dst: string, relation: string) => graph.edges.some((e) => e.src === src && e.dst === dst && e.relation === relation);
    expect(has("doc:docs/adr/0002-visibilidade.md", "doc:docs/specs/demandas.md", "decides")).toBe(true);
    expect(has("doc:docs/specs/demandas.md", "entity:demanda", "mentions")).toBe(true);
    expect(has("entity:cliente", "doc:GLOSSARY.md", "defined_in")).toBe(true);
    expect(has("doc:docs/specs/demandas.md", "file:lib/demands.ts", "references")).toBe(true);
    expect(has("doc:docs/specs/demandas.md", "tag:quadro", "tagged")).toBe(true);
  });

  it("importa o graph.json do Graphify e conecta ao arquivo de origem", () => {
    const graph = parseGraphify({
      nodes: [
        { id: "demands", label: "listDemands", source_file: "lib/demands.ts", type: "code" },
        { id: "spec", label: "Demandas", source_file: "docs/specs/demandas.md" },
      ],
      links: [{ source: "spec", target: "demands", relation: "implemented_by", confidence_score: 0.9 }],
    });
    expect(graph.edges).toContainEqual({ src: "gfy:demands", dst: "file:lib/demands.ts", relation: "source", weight: 0.75 });
    expect(graph.edges).toContainEqual({ src: "gfy:spec", dst: "doc:docs/specs/demandas.md", relation: "source", weight: 0.75 });
    expect(graph.edges).toContainEqual({ src: "gfy:spec", dst: "gfy:demands", relation: "implemented_by", weight: 0.9 });
  });

  it("propaga peso a documentos vizinhos, inclusive via arquivo de código compartilhado", () => {
    const weights = relatedDocumentWeights(
      [
        { src: "doc:a.md", dst: "doc:b.md", relation: "links_to", weight: 1 },
        { src: "doc:a.md", dst: "file:lib/x.ts", relation: "references", weight: 1 },
        { src: "doc:c.md", dst: "file:lib/x.ts", relation: "references", weight: 1 },
        { src: "doc:d.md", dst: "entity:cliente", relation: "mentions", weight: 1 },
      ],
      ["doc:a.md"],
    );
    expect(weights.get("doc:b.md")).toBe(1);
    expect(weights.get("doc:c.md")).toBeGreaterThan(0);
    expect(weights.has("doc:d.md")).toBe(false);
    expect(weights.has("doc:a.md")).toBe(false);
  });
});

describe("recuperação híbrida", () => {
  it("RRF favorece quem aparece nas duas listas", () => {
    const fused = fuseRrf([hit({ chunkId: "lex", lexRank: 1 }), hit({ chunkId: "both", lexRank: 3, vecRank: 2 }), hit({ chunkId: "vec", vecRank: 1 })]);
    expect(fused[0].chunkId).toBe("both");
  });

  it("corta candidatos fracos, limita por documento e remove duplicatas", () => {
    const candidates = fuseRrf([
      hit({ chunkId: "1", lexRank: 1, path: "a.md", content: "prazo prioridade demanda kanban" }),
      hit({ chunkId: "2", lexRank: 2, path: "b.md", content: "prazo prioridade demanda kanban" }),
      hit({ chunkId: "3", lexRank: 3, path: "a.md", content: "outro assunto sobre banco" }),
      hit({ chunkId: "4", lexRank: 4, path: "a.md", content: "terceiro trecho distinto" }),
    ]);
    const kept = selectCandidates(candidates, { maxPerDoc: 2 });
    expect(kept.map((c) => c.chunkId)).toEqual(["1", "3"]);
    candidates.push({ ...hit({ chunkId: "weak" }), score: 0.0001, graphWeight: 0, reasons: [] });
    expect(selectCandidates(candidates).some((c) => c.chunkId === "weak")).toBe(false);
  });

  it("empacota dentro do orçamento e reordena por documento e posição", () => {
    const candidates = fuseRrf([
      hit({ chunkId: "a2", lexRank: 1, path: "a.md", position: 2, tokens: 100 }),
      hit({ chunkId: "b0", lexRank: 2, path: "b.md", position: 0, tokens: 100 }),
      hit({ chunkId: "a0", lexRank: 3, path: "a.md", position: 0, tokens: 100 }),
      hit({ chunkId: "big", lexRank: 4, path: "c.md", position: 0, tokens: 900 }),
    ]);
    const packed = packWithinBudget(candidates, 400);
    expect(packed.usedTokens).toBeLessThanOrEqual(400);
    expect(packed.selected.map((c) => c.chunkId)).toEqual(["a0", "a2", "b0"]);
    expect(packed.skipped.map((c) => c.chunkId)).toEqual(["big"]);
  });
});

describe("Context Builder", () => {
  async function seededStore() {
    const store = createMemoryStore();
    await ingestDocuments({ store, embedder: null }, { project: "t", documents: corpus, pinned: ["GLOSSARY.md"], prune: true });
    return store;
  }

  it("mantém o prefixo estável entre tarefas do mesmo agente (cacheável) e o volátil no fim", async () => {
    const store = await seededStore();
    const first = await buildContext({ store, embedder: null }, { project: "t", agent: "code", task: "prazo da demanda" });
    const second = await buildContext({ store, embedder: null }, { project: "t", agent: "tdd", task: "slug do case" });
    expect(first.prefixHash).toBe(second.prefixHash);
    expect(first.prompt.system[0].cache_control).toEqual({ type: "ephemeral" });
    const last = first.prompt.messages.at(-1)!;
    expect(last.content[0]).not.toHaveProperty("cache_control");
    expect(last.content[0].text).toContain("<tarefa>\nprazo da demanda\n</tarefa>");
    expect(first.prompt.system[0].text).toContain("Contato comercial cadastrado no admin.");
  });

  it("entrega só o necessário: fontes relevantes e muito menos tokens que o corpus inteiro", async () => {
    const store = await seededStore();
    const built = await buildContext({ store, embedder: null }, { project: "t", task: "a página do case aceita slug?" });
    expect(built.sources[0].path).toBe("docs/specs/cases.md");
    expect(built.sources.some((s) => s.path === "docs/adr/0002-visibilidade.md")).toBe(false);
    expect(built.retrievalMode).toBe("lexical");
  });

  it("usa o grafo para trazer a decisão ligada à spec", async () => {
    const store = await seededStore();
    const built = await buildContext({ store, embedder: null }, { project: "t", agent: "review", task: "quem vê as demandas no kanban?" });
    const paths = built.sources.map((s) => s.path);
    expect(paths).toContain("docs/adr/0002-visibilidade.md");
    expect(built.entities).toContain("Demanda");
  });

  it("seleciona histórico: últimas mensagens + antigas relevantes, dentro do orçamento", () => {
    const history = [
      { role: "user" as const, content: "Vamos falar do prazo das demandas e prioridade." },
      { role: "assistant" as const, content: "Ok. ".repeat(400) },
      { role: "user" as const, content: "Assunto aleatório sobre cores." },
      { role: "assistant" as const, content: "Resposta curta." },
      { role: "user" as const, content: "Mais um." },
      { role: "assistant" as const, content: "Certo." },
    ];
    const selected = selectHistory(history, "prazo e prioridade das demandas", 300, 3);
    expect(selected.messages.map((m) => m.content)).toEqual([history[0].content, history[3].content, history[4].content, history[5].content]);
    expect(selected.dropped).toBe(2);
    expect(selected.tokens).toBeLessThanOrEqual(300);
  });

  it("resolve perfis a partir das skills existentes, sem agentes novos", () => {
    expect(resolveProfile("tdd").id).toBe("code");
    expect(resolveProfile("to-spec").id).toBe("spec");
    expect(resolveProfile("desconhecido").id).toBe("default");
  });
});

describe("ingestão incremental", () => {
  it("só reprocessa notas alteradas e reaproveita embeddings por hash de chunk", async () => {
    const store = createMemoryStore();
    const embed = vi.fn(async (texts: string[]) => texts.map((_, i) => [i + 1, 1, 0]));
    const embedder: Embedder = { model: "fake", dimensions: 3, embed };
    const first = await ingestDocuments({ store, embedder }, { project: "t", documents: corpus, prune: true });
    expect(first.changed).toBe(corpus.length);
    const calls = embed.mock.calls.length;
    const second = await ingestDocuments({ store, embedder }, { project: "t", documents: corpus, prune: true });
    expect(second).toMatchObject({ changed: 0, unchanged: corpus.length, embedded: 0 });
    expect(embed.mock.calls.length).toBe(calls);
    const pruned = await ingestDocuments({ store, embedder }, { project: "t", documents: corpus.slice(0, 2), prune: true });
    expect(pruned.removed).toBe(2);
  });
});

describe("embeddings Workers AI", () => {
  it("chama a API REST em lotes e cacheia consultas repetidas", async () => {
    const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init!.body)) as { text: string[] };
      return new Response(JSON.stringify({ success: true, result: { shape: [body.text.length, 2], data: body.text.map(() => [0.1, 0.2]) } }));
    });
    const embedder = createWorkersAiEmbedder({ CLOUDFLARE_ACCOUNT_ID: "acc", CLOUDFLARE_AI_TOKEN: "tok" }, fetchImpl as unknown as typeof fetch)!;
    expect(await embedder.embed(Array.from({ length: 40 }, (_, i) => `t${i}`))).toHaveLength(40);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const cached = withQueryCache(embedder);
    await cached.embedQuery("Pergunta");
    await cached.embedQuery("pergunta ");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(createWorkersAiEmbedder({})).toBeNull();
  });
});

describe("custos, métricas e avaliação", () => {
  it("calcula custo com e sem cache (Opus 5.5)", () => {
    const usage = { inputTokens: 1000, outputTokens: 500, cacheReadTokens: 4000, cacheWriteTokens: 0 };
    expect(costUsd("claude-opus-5-5", usage)).toBeCloseTo((1000 * 4 + 500 * 20 + 4000 * 0.2) / 1e6, 10);
    expect(costWithoutCacheUsd("claude-opus-5-5", usage)).toBeCloseTo((5000 * 4 + 500 * 20) / 1e6, 10);
  });

  it("agrega execuções: latência, cache, economia de contexto e qualidade", () => {
    const summary = summarizeRuns([
      { project: "t", agent: "code", operation: "ask", model: "claude-opus-5-5", inputTokens: 500, cacheReadTokens: 1500, cacheWriteTokens: 0, outputTokens: 200, contextTokens: 2000, baselineTokens: 20000, costUsd: 0.0059, latencyMs: 900, quality: { factCoverage: 1 } },
      { project: "t", agent: "code", operation: "context", contextTokens: 2000, baselineTokens: 20000, latencyMs: 100 },
    ]);
    expect(summary.overall.contextSavingsPct).toBe(0.9);
    expect(summary.overall.cacheHitRate).toBe(0.75);
    expect(summary.overall.latencyMs.p95).toBe(900);
    expect(summary.overall.cacheSavingsUsd).toBeGreaterThan(0);
    expect(summary.byOperation.ask.quality.factCoverage).toBe(1);
  });

  it("mede recall, precisão, MRR e nDCG", () => {
    expect(retrievalMetrics(["x", "a", "b"], ["a", "c"], 3)).toEqual({ recall: 0.5, precision: 0.3333, mrr: 0.5, ndcg: 0.3869, hit: 1 });
    expect(retrievalMetrics(["x"], ["a"], 3).hit).toBe(0);
  });

  it("mede cobertura de fatos e validade das citações da resposta", () => {
    const citations = extractCitations("Usa `due_on` [S1] e prioridade [S9].", ["S1", "S2"]);
    expect(citations).toEqual({ cited: ["S1", "S9"], valid: ["S1"], invalid: ["S9"] });
    expect(answerMetrics("Campo DUE_ON, prioridade alta", ["due_on", "responsável"], citations)).toMatchObject({ factCoverage: 0.5, citationValidity: 0.5 });
  });

  it("estima tokens e normaliza termos em português", () => {
    expect(estimateTokens("a".repeat(36))).toBe(10);
    expect(terms("As Demandas e as Decisões")).toEqual(["demanda", "decisao"]);
  });
});

describe("autenticação da API de memória", () => {
  it("aceita só chaves configuradas, por Bearer ou x-memory-key", async () => {
    const req = (headers: Record<string, string>) => new Request("http://x/api/memory/search", { headers });
    expect(await isAuthorized(req({ authorization: "Bearer k2" }), "k1, k2")).toBe(true);
    expect(await isAuthorized(req({ "x-memory-key": "k1" }), "k1")).toBe(true);
    expect(await isAuthorized(req({ authorization: "Bearer nope" }), "k1")).toBe(false);
    await expect(isAuthorized(req({}), "")).rejects.toThrow("MEMORY_API_KEYS");
  });
});
