// Chamada ao modelo com o contexto montado. O layout do Context Builder coloca o prefixo
// estável (system + histórico) antes dos breakpoints de cache e o conteúdo volátil depois,
// então perguntas seguidas do mesmo agente leem o prefixo do cache (~0,05× do preço no Opus 5.5).
import Anthropic from "@anthropic-ai/sdk";
import type { BuiltContext } from "@/lib/memory/context-builder";
import { costUsd, costWithoutCacheUsd, type TokenUsage } from "@/lib/memory/pricing";

export const DEFAULT_MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;
function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY não configurada.");
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export function hasLlmEnv() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function extractCitations(text: string, sourceIds: string[]) {
  const cited = [...new Set([...text.matchAll(/\[(S\d+)\]/g)].map((match) => match[1]))];
  const valid = cited.filter((id) => sourceIds.includes(id));
  return { cited, valid, invalid: cited.filter((id) => !sourceIds.includes(id)) };
}

export async function askWithContext(
  built: BuiltContext,
  options: { model?: string; effort?: "low" | "medium" | "high"; maxTokens?: number } = {},
) {
  const model = options.model ?? process.env.MEMORY_MODEL ?? DEFAULT_MODEL;
  const messages = built.prompt.messages as Anthropic.Beta.BetaMessageParam[];
  if (messages[0]?.role === "assistant") messages.unshift({ role: "user", content: "(início da conversa omitido)" });

  const response = await anthropic().beta.messages.create({
    model,
    max_tokens: options.maxTokens ?? 4000,
    // Opus 5.5 usa pensamento adaptativo por padrão; o esforço é o controle de custo.
    output_config: { effort: options.effort ?? "medium" },
    // Fallback no servidor em caso de recusa por classificador: a pergunta é respondida por outro modelo.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: built.prompt.system,
    messages,
  });

  const answer = response.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  const usage: TokenUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
  };
  const servedBy = response.model;

  return {
    answer,
    model: servedBy,
    stopReason: response.stop_reason,
    refused: response.stop_reason === "refusal",
    usage,
    costUsd: costUsd(servedBy, usage),
    costWithoutCacheUsd: costWithoutCacheUsd(servedBy, usage),
    citations: extractCitations(answer, built.sources.map((source) => source.id)),
  };
}
