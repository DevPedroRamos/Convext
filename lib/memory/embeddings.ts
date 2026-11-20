// Embeddings via Cloudflare Workers AI (bge-m3: multilíngue, 1024 dimensões). Usa a API REST
// para funcionar igual no Worker, no `next dev` e em scripts. Sem credenciais, a memória opera
// só com busca textual e informa `retrievalMode: "lexical"`.

export type Embedder = {
  model: string;
  dimensions: number;
  embed(texts: string[]): Promise<number[][]>;
};

type Env = Record<string, string | undefined>;

export const EMBEDDING_MODEL = "@cf/baai/bge-m3";
const BATCH_SIZE = 32;

export function createWorkersAiEmbedder(env: Env = process.env, fetchImpl: typeof fetch = fetch): Embedder | null {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const token = env.CLOUDFLARE_AI_TOKEN;
  if (!accountId || !token) return null;
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${EMBEDDING_MODEL}`;

  return {
    model: EMBEDDING_MODEL,
    dimensions: 1024,
    async embed(texts) {
      const vectors: number[][] = [];
      for (let start = 0; start < texts.length; start += BATCH_SIZE) {
        const batch = texts.slice(start, start + BATCH_SIZE);
        const response = await fetchImpl(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ text: batch, truncate_inputs: true }),
        });
        if (!response.ok) throw new Error(`Workers AI respondeu ${response.status}.`);
        const payload = (await response.json()) as { result?: { data?: number[][]; response?: number[][] } };
        const data = payload.result?.data ?? payload.result?.response;
        if (!Array.isArray(data) || data.length !== batch.length) throw new Error("Resposta de embedding inesperada.");
        vectors.push(...data);
      }
      return vectors;
    },
  };
}

/** Cache de embeddings de consulta por isolate: perguntas repetidas não pagam nova chamada. */
export function withQueryCache(embedder: Embedder, maxEntries = 256): Embedder & { embedQuery(text: string): Promise<number[]> } {
  const cache = new Map<string, number[]>();
  return {
    ...embedder,
    async embedQuery(text: string) {
      const key = text.trim().toLowerCase();
      const hit = cache.get(key);
      if (hit) {
        cache.delete(key);
        cache.set(key, hit);
        return hit;
      }
      const [vector] = await embedder.embed([text]);
      cache.set(key, vector);
      if (cache.size > maxEntries) cache.delete(cache.keys().next().value!);
      return vector;
    },
  };
}

export type QueryEmbedder = ReturnType<typeof withQueryCache>;
