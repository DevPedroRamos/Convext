// Avaliação automatizada: qualidade de recuperação (recall, precisão, MRR, nDCG) e de resposta
// (cobertura de fatos esperados e validade das citações), além de tokens por caso.
import { buildContext, type MemoryDeps } from "@/lib/memory/context-builder";
import { normalize } from "@/lib/memory/text";

export type EvalCase = {
  id: string;
  query: string;
  agent?: string;
  /** Caminhos de documentos que precisam aparecer no contexto. */
  relevant: string[];
  /** Fatos que uma boa resposta precisa conter (modo answer). */
  mustInclude?: string[];
};

const round = (value: number) => Number(value.toFixed(4));

export function retrievalMetrics(retrieved: string[], relevant: string[], k: number) {
  const ranked = [...new Set(retrieved)].slice(0, k);
  const relevantSet = new Set(relevant);
  const hits = ranked.filter((path) => relevantSet.has(path));
  const firstHit = ranked.findIndex((path) => relevantSet.has(path));
  const dcg = ranked.reduce((sum, path, index) => sum + (relevantSet.has(path) ? 1 / Math.log2(index + 2) : 0), 0);
  const idealHits = Math.min(relevant.length, k);
  let idcg = 0;
  for (let index = 0; index < idealHits; index += 1) idcg += 1 / Math.log2(index + 2);
  return {
    recall: relevant.length ? round(hits.length / relevant.length) : 1,
    precision: ranked.length ? round(hits.length / ranked.length) : 0,
    mrr: firstHit >= 0 ? round(1 / (firstHit + 1)) : 0,
    ndcg: idcg ? round(dcg / idcg) : 0,
    hit: firstHit >= 0 ? 1 : 0,
  };
}

export function answerMetrics(answer: string, mustInclude: string[], citations: { cited: string[]; valid: string[] }) {
  const text = normalize(answer);
  const covered = mustInclude.filter((fact) => text.includes(normalize(fact)));
  return {
    factCoverage: mustInclude.length ? round(covered.length / mustInclude.length) : 1,
    missingFacts: mustInclude.filter((fact) => !covered.includes(fact)),
    citationValidity: citations.cited.length ? round(citations.valid.length / citations.cited.length) : 0,
    cited: citations.cited.length,
  };
}

function mean(values: number[]) {
  return values.length ? round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
}

export type EvalVariant = { name: string; useGraph: boolean };

export async function runRetrievalEval(deps: MemoryDeps, project: string, cases: EvalCase[], options: { k?: number; variants?: EvalVariant[] } = {}) {
  const k = options.k ?? 5;
  const variants = options.variants ?? [
    { name: "hybrid+graph", useGraph: true },
    { name: "hybrid", useGraph: false },
  ];
  const results = [];
  for (const variant of variants) {
    const perCase = [];
    for (const testCase of cases) {
      const started = performance.now();
      const built = await buildContext(deps, { project, agent: testCase.agent, task: testCase.query, useGraph: variant.useGraph });
      const latencyMs = performance.now() - started;
      // Documentos fixados já estão no system prompt: contam como presentes, não como recuperação.
      const relevant = testCase.relevant.filter((path) => !built.pinned.includes(path));
      const metrics = retrievalMetrics(built.sources.map((source) => source.path), relevant, k);
      perCase.push({
        id: testCase.id,
        ...metrics,
        contextTokens: built.stats.contextTokens,
        baselineTokens: built.stats.baselineTokens,
        retrieved: [...new Set(built.sources.map((s) => s.path))].slice(0, k),
        latencyMs: Math.round(latencyMs),
        mode: built.retrievalMode,
      });
    }
    results.push({
      variant: variant.name,
      metrics: {
        [`recall@${k}`]: mean(perCase.map((c) => c.recall)),
        [`precision@${k}`]: mean(perCase.map((c) => c.precision)),
        mrr: mean(perCase.map((c) => c.mrr)),
        [`ndcg@${k}`]: mean(perCase.map((c) => c.ndcg)),
        hitRate: mean(perCase.map((c) => c.hit)),
        avgContextTokens: Math.round(mean(perCase.map((c) => c.contextTokens))),
        avgBaselineTokens: Math.round(mean(perCase.map((c) => c.baselineTokens))),
        tokenSavingsPct: round(1 - perCase.reduce((s, c) => s + c.contextTokens, 0) / Math.max(1, perCase.reduce((s, c) => s + c.baselineTokens, 0))),
        avgLatencyMs: Math.round(mean(perCase.map((c) => c.latencyMs))),
      },
      cases: perCase,
    });
  }
  return { k, cases: cases.length, variants: results };
}
