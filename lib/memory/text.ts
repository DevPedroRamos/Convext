// Utilitários de texto compartilhados por chunking, busca textual, grafo e avaliação.
// Sem dependências: roda no Worker, no Node e nos testes.

const STOPWORDS = new Set(
  (
    "a o e é de da do das dos em no na nos nas um uma uns umas para por com sem que se ao aos à às " +
    "como mais menos mas ou ser ter está estão foi são há pelo pela pelos pelas este esta isso isto esse essa " +
    "seu sua seus suas ele ela eles elas eu nós você vocês não sim já quando onde qual quais quem também " +
    "entre sobre até após cada todo toda todos todas outro outra deve pode faz fica ficam via " +
    "the of and to in is for on with as by an be or it at from this that"
  )
    .split(" ")
    .map((word) => stripAccents(word)),
);

export function stripAccents(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function normalize(text: string) {
  return stripAccents(text).toLowerCase();
}

/** Stemming leve para português: o suficiente para casar singular/plural e -ção/-ções. */
export function stem(term: string) {
  if (term.length <= 3) return term;
  if (term.endsWith("coes")) return `${term.slice(0, -4)}cao`;
  if (term.endsWith("oes") || term.endsWith("aes")) return `${term.slice(0, -3)}ao`;
  if (term.endsWith("ais")) return `${term.slice(0, -3)}al`;
  if (term.endsWith("eis")) return `${term.slice(0, -3)}el`;
  if (term.endsWith("ns")) return `${term.slice(0, -2)}m`;
  if (term.endsWith("s") && !term.endsWith("ss")) return term.slice(0, -1);
  return term;
}

export function terms(text: string) {
  return normalize(text)
    .split(/[^a-z0-9_]+/)
    .filter((term) => term.length > 1 && !STOPWORDS.has(term))
    .map(stem);
}

/**
 * Estimativa de tokens sem tokenizer (o Worker não carrega um). Calibrada para texto
 * em português com markdown (~3,6 caracteres por token). Os tokens reais das chamadas
 * ao modelo vêm de `usage` e são registrados em kb_runs para medir o erro da estimativa.
 */
export function estimateTokens(text: string) {
  return text ? Math.ceil(text.length / 3.6) : 0;
}

export function jaccard(a: Set<string>, b: Set<string>) {
  if (!a.size && !b.size) return 1;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

export function slugify(text: string) {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function sha256(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function truncateToTokens(text: string, maxTokens: number) {
  if (estimateTokens(text) <= maxTokens) return text;
  const maxChars = Math.floor(maxTokens * 3.6);
  const cut = text.slice(0, maxChars);
  const lastBreak = cut.lastIndexOf("\n");
  return `${lastBreak > maxChars * 0.6 ? cut.slice(0, lastBreak) : cut}\n…`;
}
