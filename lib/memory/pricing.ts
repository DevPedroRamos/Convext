// Preço por milhão de tokens (API Anthropic, 2026-11). Escrita em cache de 5 min = 1,25× a
// entrada; leitura conforme tabela do modelo. Atualizar aqui quando a tabela de preços mudar.
export type ModelPrice = { input: number; output: number; cacheRead: number; cacheWrite: number };

const PRICES: Record<string, ModelPrice> = {
  "claude-fable-5-2": { input: 8, output: 40, cacheRead: 0.2, cacheWrite: 10 },
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
};

export function priceFor(model: string): ModelPrice {
  return PRICES[model] ?? PRICES["claude-opus-5-5"];
}

export type TokenUsage = { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number };

export function costUsd(model: string, usage: TokenUsage) {
  const price = priceFor(model);
  return (
    (usage.inputTokens * price.input + usage.outputTokens * price.output + usage.cacheReadTokens * price.cacheRead + usage.cacheWriteTokens * price.cacheWrite) /
    1_000_000
  );
}

/** O mesmo consumo sem cache: todo token de entrada pago a preço cheio. */
export function costWithoutCacheUsd(model: string, usage: TokenUsage) {
  const price = priceFor(model);
  const input = usage.inputTokens + usage.cacheReadTokens + usage.cacheWriteTokens;
  return (input * price.input + usage.outputTokens * price.output) / 1_000_000;
}
