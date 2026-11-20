// Benchmark offline sobre o vault real (docs/ + glossário + produto + spec técnica).
// Não usa banco, rede nem chaves: store em memória, busca textual (BM25) + grafo.
// Compara o Context Builder com o envio da documentação inteira e mede o efeito do cache.
// Em produção a busca vetorial (bge-m3) entra na fusão e só pode melhorar o recall.
import * as fs from "node:fs";
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildContext } from "@/lib/memory/context-builder";
import { runRetrievalEval, type EvalCase } from "@/lib/memory/evaluation";
import { ingestDocuments } from "@/lib/memory/ingest";
import { costUsd } from "@/lib/memory/pricing";
import { createMemoryStore } from "@/lib/memory/store-memory";

const root = path.resolve(import.meta.dirname, "../..");
const settings = JSON.parse(readFileSync(path.join(root, "memory.config.json"), "utf8")) as {
  project: string;
  include: string[];
  exclude: string[];
  pinned: string[];
  goldenSet: string;
};
const cases = JSON.parse(readFileSync(path.join(root, settings.goldenSet), "utf8")) as EvalCase[];

// fs.globSync existe no Node 22+; os tipos do projeto (@types/node 20) ainda não o declaram.
const globSync = (fs as unknown as { globSync: (pattern: string, options: { cwd: string; exclude: string[] }) => string[] }).globSync;

function loadVault() {
  const files = new Set<string>();
  for (const pattern of settings.include) for (const file of globSync(pattern, { cwd: root, exclude: settings.exclude })) files.add(file.replace(/\\/g, "/"));
  return [...files].sort().map((file) => ({ path: file, content: readFileSync(path.join(root, file), "utf8") }));
}

const store = createMemoryStore();
const deps = { store, embedder: null };
const project = settings.project;

beforeAll(async () => {
  await ingestDocuments(deps, { project, documents: loadVault(), pinned: settings.pinned, prune: true });
});

describe("benchmark da memória sobre o vault real", () => {
  it("recupera os documentos certos com uma fração dos tokens", async () => {
    const report = await runRetrievalEval(deps, project, cases, { k: 5 });
    const [withGraph, withoutGraph] = report.variants;
    console.table(Object.fromEntries(report.variants.map((variant) => [variant.variant, variant.metrics])));
    const misses = withGraph.cases.filter((c) => c.recall < 1).map((c) => ({ id: c.id, recall: c.recall, retrieved: c.retrieved.join(", ") }));
    if (misses.length) console.table(misses);

    expect(withGraph.metrics["recall@5"]).toBeGreaterThanOrEqual(0.9);
    expect(withGraph.metrics.hitRate).toBeGreaterThanOrEqual(0.9);
    expect(withGraph.metrics.mrr).toBeGreaterThanOrEqual(0.75);
    expect(withGraph.metrics.tokenSavingsPct).toBeGreaterThanOrEqual(0.85);
    // O grafo não pode piorar a recuperação.
    expect(withGraph.metrics["recall@5"]).toBeGreaterThanOrEqual(withoutGraph.metrics["recall@5"]);
  });

  it("o layout do prompt converte o prefixo em leitura de cache numa sessão de agente", async () => {
    const model = "claude-opus-5-5";
    const outputTokens = 400;
    const session = cases.filter((c) => (c.agent ?? "default") === "code");
    const built = await Promise.all(session.map((c) => buildContext(deps, { project, agent: c.agent, task: c.query })));
    expect(new Set(built.map((b) => b.prefixHash)).size).toBe(1);

    const corpusTokens = (await store.corpusStats(project)).tokens;
    let fullDump = 0;
    let fullDumpCached = 0;
    let selectiveNoCache = 0;
    let selectiveCached = 0;
    built.forEach((b, index) => {
      const volatile = b.stats.contextTokens - b.stats.systemTokens;
      fullDump += costUsd(model, { inputTokens: corpusTokens + volatile, outputTokens, cacheReadTokens: 0, cacheWriteTokens: 0 });
      fullDumpCached += costUsd(model, {
        inputTokens: volatile,
        outputTokens,
        cacheReadTokens: index === 0 ? 0 : corpusTokens,
        cacheWriteTokens: index === 0 ? corpusTokens : 0,
      });
      selectiveNoCache += costUsd(model, { inputTokens: b.stats.contextTokens, outputTokens, cacheReadTokens: 0, cacheWriteTokens: 0 });
      selectiveCached += costUsd(model, {
        inputTokens: volatile,
        outputTokens,
        cacheReadTokens: index === 0 ? 0 : b.stats.systemTokens,
        cacheWriteTokens: index === 0 ? b.stats.systemTokens : 0,
      });
    });
    const inputOnly = (total: number) => total - session.length * costUsd(model, { inputTokens: 0, outputTokens, cacheReadTokens: 0, cacheWriteTokens: 0 });
    console.table({
      "documentação inteira": { custoUsd: fullDump.toFixed(5), custoEntradaUsd: inputOnly(fullDump).toFixed(5) },
      "documentação inteira + cache": { custoUsd: fullDumpCached.toFixed(5), custoEntradaUsd: inputOnly(fullDumpCached).toFixed(5) },
      "contexto seletivo": { custoUsd: selectiveNoCache.toFixed(5), custoEntradaUsd: inputOnly(selectiveNoCache).toFixed(5) },
      "seletivo + cache": { custoUsd: selectiveCached.toFixed(5), custoEntradaUsd: inputOnly(selectiveCached).toFixed(5) },
    });
    expect(inputOnly(selectiveNoCache)).toBeLessThan(inputOnly(fullDump) * 0.2);
    expect(inputOnly(selectiveCached)).toBeLessThan(inputOnly(selectiveNoCache));
    expect(inputOnly(selectiveCached)).toBeLessThan(inputOnly(fullDumpCached));
  });

  it("monta o contexto rápido o bastante para ficar no caminho de cada execução", async () => {
    const started = performance.now();
    for (const testCase of cases) await buildContext(deps, { project, agent: testCase.agent, task: testCase.query });
    const avgMs = (performance.now() - started) / cases.length;
    console.log(`Context Builder (store em memória): ${avgMs.toFixed(1)} ms por execução`);
    expect(avgMs).toBeLessThan(150);
  });
});
