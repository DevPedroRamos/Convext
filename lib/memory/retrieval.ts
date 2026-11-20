// Fusão híbrida (RRF), reforço por grafo, deduplicação e empacotamento por orçamento de tokens.
import { estimateTokens, jaccard, terms } from "@/lib/memory/text";
import type { SearchHit } from "@/lib/memory/types";

export type Candidate = SearchHit & { score: number; graphWeight: number; reasons: string[] };

export type Source = {
  id: string;
  path: string;
  title: string;
  heading: string;
  kind: string;
  score: number;
  tokens: number;
  reasons: string[];
};

/** Reciprocal Rank Fusion: robusto a escalas diferentes entre ts_rank e similaridade de cosseno. */
export function fuseRrf(hits: SearchHit[], options: { k?: number; lexWeight?: number; vecWeight?: number } = {}): Candidate[] {
  const k = options.k ?? 60;
  const lexWeight = options.lexWeight ?? 1;
  const vecWeight = options.vecWeight ?? 1;
  return hits
    .map((hit) => {
      const reasons: string[] = [];
      let score = 0;
      if (hit.lexRank) {
        score += lexWeight / (k + hit.lexRank);
        reasons.push(`texto#${hit.lexRank}`);
      }
      if (hit.vecRank) {
        score += vecWeight / (k + hit.vecRank);
        reasons.push(`vetor#${hit.vecRank}`);
      }
      return { ...hit, score, graphWeight: 0, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export function applyKindWeights(candidates: Candidate[], weights: Partial<Record<string, number>>) {
  for (const candidate of candidates) {
    const factor = weights[candidate.kind];
    if (factor && factor !== 1) {
      candidate.score *= factor;
      candidate.reasons.push(`perfil×${factor}`);
    }
  }
  return candidates.sort((a, b) => b.score - a.score);
}

/**
 * Expansão pelo grafo. O ranking híbrido da seleção fica intacto (o grafo não pode deslocar o
 * melhor resultado); documentos fortemente ligados aos primeiros resultados ou às entidades da
 * pergunta, que ficaram de fora do corte, entram no fim da lista e só usam o orçamento que
 * sobrar. Exige que o trecho tenha casado com a consulta em alguma lista (não injeta texto alheio).
 */
export function expandWithGraph(
  selected: Candidate[],
  candidates: Candidate[],
  related: Map<string, number>,
  options: { maxAdd?: number; minWeight?: number } = {},
) {
  const maxAdd = options.maxAdd ?? 2;
  const minWeight = options.minWeight ?? 0.3;
  const present = new Set(selected.map((candidate) => candidate.path));
  const additions: Candidate[] = [];
  const byWeight = candidates
    .filter((candidate) => !present.has(candidate.path) && (related.get(`doc:${candidate.path}`) ?? 0) >= minWeight)
    .sort((a, b) => (related.get(`doc:${b.path}`) ?? 0) - (related.get(`doc:${a.path}`) ?? 0) || b.score - a.score);
  for (const candidate of byWeight) {
    if (additions.length >= maxAdd || present.has(candidate.path)) continue;
    const weight = related.get(`doc:${candidate.path}`)!;
    present.add(candidate.path);
    additions.push({ ...candidate, graphWeight: weight, reasons: [...candidate.reasons, `grafo+${weight.toFixed(2)}`] });
  }
  for (const candidate of selected) {
    const weight = related.get(`doc:${candidate.path}`);
    if (weight) {
      candidate.graphWeight = weight;
      candidate.reasons.push(`grafo+${weight.toFixed(2)}`);
    }
  }
  return [...selected, ...additions];
}

/**
 * Corte seletivo: descarta o que pontua muito abaixo do melhor candidato, limita trechos
 * por documento e remove quase-duplicatas. É aqui que o contexto deixa de ser "tudo".
 */
export function selectCandidates(candidates: Candidate[], options: { minRelative?: number; maxPerDoc?: number; dedupe?: number } = {}) {
  const minRelative = options.minRelative ?? 0.3;
  const maxPerDoc = options.maxPerDoc ?? 3;
  const dedupe = options.dedupe ?? 0.8;
  const top = candidates[0]?.score ?? 0;
  const perDoc = new Map<string, number>();
  const kept: { candidate: Candidate; termSet: Set<string> }[] = [];
  for (const candidate of candidates) {
    if (candidate.score < top * minRelative) break;
    if ((perDoc.get(candidate.path) ?? 0) >= maxPerDoc) continue;
    const termSet = new Set(terms(candidate.content));
    if (kept.some((item) => jaccard(item.termSet, termSet) >= dedupe)) continue;
    kept.push({ candidate, termSet });
    perDoc.set(candidate.path, (perDoc.get(candidate.path) ?? 0) + 1);
  }
  return kept.map((item) => item.candidate);
}

/** Guloso por relevância dentro do orçamento; a saída é reordenada por documento e posição. */
export function packWithinBudget(candidates: Candidate[], budgetTokens: number) {
  const selected: Candidate[] = [];
  const skipped: Candidate[] = [];
  let used = 0;
  for (const candidate of candidates) {
    const cost = candidate.tokens + 18; // cabeçalho [S#] path — seção
    if (used + cost > budgetTokens) {
      skipped.push(candidate);
      continue;
    }
    selected.push(candidate);
    used += cost;
  }
  const docOrder = new Map<string, number>();
  selected.forEach((candidate, index) => {
    if (!docOrder.has(candidate.path)) docOrder.set(candidate.path, index);
  });
  selected.sort((a, b) => docOrder.get(a.path)! - docOrder.get(b.path)! || a.position - b.position);
  return { selected, skipped, usedTokens: used };
}

export function renderSources(selected: Candidate[]) {
  const sources: Source[] = selected.map((candidate, index) => ({
    id: `S${index + 1}`,
    path: candidate.path,
    title: candidate.title,
    heading: candidate.heading,
    kind: candidate.kind,
    score: Number(candidate.score.toFixed(5)),
    tokens: candidate.tokens,
    reasons: candidate.reasons,
  }));
  const text = selected
    .map((candidate, index) => `### [S${index + 1}] ${candidate.path}${candidate.heading ? ` — ${candidate.heading}` : ""}\n${candidate.content.trim()}`)
    .join("\n\n");
  return { sources, text, tokens: estimateTokens(text) };
}
