// Context Builder: monta, por agente e por execução, só o contexto necessário.
//
// Layout pensado para prompt caching (prefixo estável primeiro):
//   system  = instruções base + perfil do agente + conhecimento fixado (pinned)  ← breakpoint de cache
//   messages = histórico selecionado                                          ← breakpoint de cache (se houver)
//              + mensagem final com fatos, trechos recuperados e a tarefa      ← volátil, nunca cacheada
import type { QueryEmbedder } from "@/lib/memory/embeddings";
import { matchEntities, relatedDocumentWeights } from "@/lib/memory/graph";
import { parseFrontmatter } from "@/lib/memory/markdown";
import { resolveProfile, type AgentProfile } from "@/lib/memory/profiles";
import { applyKindWeights, expandWithGraph, fuseRrf, packWithinBudget, renderSources, selectCandidates, type Source } from "@/lib/memory/retrieval";
import type { KnowledgeStore } from "@/lib/memory/store";
import { estimateTokens, sha256, terms, truncateToTokens } from "@/lib/memory/text";
import type { HistoryMessage } from "@/lib/memory/types";

export type MemoryDeps = { store: KnowledgeStore; embedder: QueryEmbedder | null };

export type BuildContextInput = {
  project: string;
  agent?: string;
  task: string;
  budgetTokens?: number;
  k?: number;
  history?: HistoryMessage[];
  useGraph?: boolean;
  kinds?: string[];
};

const BASE_INSTRUCTIONS = [
  "Você é um agente que trabalha no projeto Convext (plataforma da agência Convext Mídias).",
  "Use somente o conhecimento fixado abaixo e os trechos entregues em <contexto>. Cada trecho tem um identificador [S#].",
  "Cite os identificadores das fontes usadas. Quando o contexto não for suficiente, diga o que falta em vez de inventar.",
].join("\n");

export function selectHistory(history: HistoryMessage[], task: string, budgetTokens: number, keepLast = 4) {
  const fullTokens = history.reduce((sum, message) => sum + estimateTokens(message.content), 0);
  const keep = new Set<number>();
  let used = 0;
  for (let index = history.length - 1; index >= 0 && keep.size < keepLast; index -= 1) {
    const tokens = estimateTokens(history[index].content);
    if (used + tokens > budgetTokens) break;
    keep.add(index);
    used += tokens;
  }
  const taskTerms = new Set(terms(task));
  const older = history
    .map((message, index) => {
      const messageTerms = new Set(terms(message.content));
      let overlap = 0;
      for (const term of taskTerms) if (messageTerms.has(term)) overlap += 1;
      return { index, relevance: taskTerms.size ? overlap / taskTerms.size : 0, tokens: estimateTokens(message.content) };
    })
    .filter((item) => !keep.has(item.index) && item.relevance >= 0.25)
    .sort((a, b) => b.relevance - a.relevance);
  for (const item of older) {
    if (used + item.tokens > budgetTokens) continue;
    keep.add(item.index);
    used += item.tokens;
  }
  const messages = [...keep].sort((a, b) => a - b).map((index) => history[index]);
  return { messages, tokens: used, fullTokens, kept: messages.length, dropped: history.length - messages.length };
}

function renderPinned(pinned: { path: string; title: string; content: string }[], budgetTokens: number) {
  const parts: string[] = [];
  let remaining = budgetTokens;
  for (const doc of [...pinned].sort((a, b) => a.path.localeCompare(b.path))) {
    if (remaining < 60) break;
    const body = parseFrontmatter(doc.content).body.replace(/<!--[\s\S]*?-->/g, "").replace(/\n{3,}/g, "\n\n").trim();
    const block = truncateToTokens(`### ${doc.title} (${doc.path})\n${body}`, remaining);
    parts.push(block);
    remaining -= estimateTokens(block);
  }
  return parts.join("\n\n");
}

export async function buildContext(deps: MemoryDeps, input: BuildContextInput) {
  const profile: AgentProfile = resolveProfile(input.agent);
  const budget = input.budgetTokens ?? profile.budgetTokens;
  const k = input.k ?? profile.k;
  const useGraph = input.useGraph ?? true;
  const warnings: string[] = [];

  let embedding: number[] | null = null;
  if (deps.embedder) {
    try {
      embedding = await deps.embedder.embedQuery(input.task);
    } catch (error) {
      warnings.push(`embedding indisponível: ${(error as Error).message}`);
    }
  }

  const [hits, pinned, corpus, entities] = await Promise.all([
    deps.store.search({ project: input.project, query: input.task, embedding, limit: k * 3, kinds: input.kinds }),
    deps.store.pinned(input.project),
    deps.store.corpusStats(input.project),
    useGraph ? deps.store.entities(input.project) : Promise.resolve([]),
  ]);

  // Documentos fixados já estão inteiros no system prompt: recuperá-los de novo duplicaria tokens.
  const pinnedPaths = new Set(pinned.map((doc) => doc.path));
  const candidates = applyKindWeights(
    fuseRrf(hits.filter((hit) => !pinnedPaths.has(hit.path))),
    profile.kindWeights,
  );
  let shortlist = selectCandidates(candidates.slice(0, k * 2)).slice(0, k);

  const queryEntities = matchEntities(input.task, entities);
  let graphAdded = 0;
  if (useGraph && candidates.length) {
    const seeds = [...new Set([...shortlist.slice(0, 3).map((c) => `doc:${c.path}`), ...queryEntities.map((e) => e.id)])];
    const edges = await deps.store.edgesTouching(input.project, seeds);
    const expanded = expandWithGraph(shortlist, candidates, relatedDocumentWeights(edges, seeds));
    graphAdded = expanded.length - shortlist.length;
    shortlist = expanded;
  }

  const systemText = `${BASE_INSTRUCTIONS}\n\n## Papel\n${profile.instructions}\n\n## Conhecimento fixado\n${renderPinned(pinned, profile.pinnedBudgetTokens)}`;

  const facts = queryEntities
    .filter((entity) => !systemText.includes(entity.definition))
    .slice(0, 6)
    .map((entity) => `- **${entity.label}**: ${entity.definition}`)
    .join("\n");
  const factsTokens = estimateTokens(facts);

  const packed = packWithinBudget(shortlist, Math.max(0, budget - factsTokens));
  const rendered = renderSources(packed.selected);

  const history = selectHistory(input.history ?? [], input.task, profile.historyBudgetTokens);
  const contextBody = [facts ? `## Termos do domínio\n${facts}` : null, rendered.text || "(nenhum trecho relevante encontrado)"]
    .filter(Boolean)
    .join("\n\n");
  const userText = `<contexto>\n${contextBody}\n</contexto>\n\n<tarefa>\n${input.task.trim()}\n</tarefa>`;

  const systemTokens = estimateTokens(systemText);
  const userTokens = estimateTokens(userText);
  const taskTokens = estimateTokens(input.task);
  const contextTokens = systemTokens + history.tokens + userTokens;
  const baselineTokens = corpus.tokens + history.fullTokens + taskTokens;

  const lastHistory = history.messages.length - 1;
  const prompt = {
    system: [{ type: "text" as const, text: systemText, cache_control: { type: "ephemeral" as const } }],
    messages: [
      ...history.messages.map((message, index) => ({
        role: message.role,
        content: [
          index === lastHistory
            ? { type: "text" as const, text: message.content, cache_control: { type: "ephemeral" as const } }
            : { type: "text" as const, text: message.content },
        ],
      })),
      { role: "user" as const, content: [{ type: "text" as const, text: userText }] },
    ],
  };

  return {
    project: input.project,
    agent: profile.id,
    retrievalMode: embedding ? ("hybrid" as const) : ("lexical" as const),
    prefixHash: await sha256(systemText),
    prompt,
    sources: rendered.sources satisfies Source[],
    /** Documentos fixados no system prompt: sempre presentes, fora do orçamento de recuperação. */
    pinned: pinned.map((doc) => doc.path).sort(),
    entities: queryEntities.map((entity) => entity.label),
    history: { kept: history.kept, dropped: history.dropped, tokens: history.tokens },
    stats: {
      systemTokens,
      historyTokens: history.tokens,
      retrievedTokens: rendered.tokens,
      factsTokens,
      contextTokens,
      cacheableTokens: systemTokens + history.tokens,
      baselineTokens,
      savingsPct: baselineTokens ? Number((1 - contextTokens / baselineTokens).toFixed(4)) : 0,
      candidates: hits.length,
      selected: packed.selected.length,
      graphAdded,
      skippedByBudget: packed.skipped.length,
      budgetTokens: budget,
      corpusDocuments: corpus.documents,
    },
    warnings,
  };
}

export type BuiltContext = Awaited<ReturnType<typeof buildContext>>;
