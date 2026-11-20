// Camada HTTP dos serviços de memória: autenticação por chave (agentes e outros projetos não
// têm sessão de usuário), validação, erros padronizados e dependências por requisição.
import { NextResponse } from "next/server";
import type { z } from "zod";
import { createWorkersAiEmbedder, withQueryCache, type QueryEmbedder } from "@/lib/memory/embeddings";
import type { KnowledgeStore } from "@/lib/memory/store";
import { createSupabaseStore } from "@/lib/memory/store-supabase";
import { sha256 } from "@/lib/memory/text";
import { createAdminClient } from "@/lib/supabase/admin";

export class MemoryHttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function isAuthorized(request: Request, configured = process.env.MEMORY_API_KEYS) {
  const keys = (configured ?? "").split(",").map((key) => key.trim()).filter(Boolean);
  if (!keys.length) throw new MemoryHttpError(503, "NOT_CONFIGURED", "MEMORY_API_KEYS não configurada.");
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : request.headers.get("x-memory-key")?.trim() ?? "";
  if (!token) return false;
  // Comparação por hash: tempo constante em relação ao conteúdo da chave.
  const tokenHash = await sha256(token);
  const hashes = await Promise.all(keys.map((key) => sha256(key)));
  return hashes.some((hash) => hash === tokenHash);
}

let embedder: QueryEmbedder | null | undefined;

export function memoryDeps(): { store: KnowledgeStore; embedder: QueryEmbedder | null } {
  if (embedder === undefined) {
    const base = createWorkersAiEmbedder();
    embedder = base ? withQueryCache(base) : null;
  }
  return { store: createSupabaseStore(createAdminClient() as never), embedder };
}

const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function handleMemory<S extends z.ZodTypeAny>(
  request: Request,
  schema: S,
  handler: (input: z.output<S>, ctx: ReturnType<typeof memoryDeps> & { startedAt: number }) => Promise<unknown>,
) {
  const startedAt = performance.now();
  try {
    if (!(await isAuthorized(request))) throw new MemoryHttpError(401, "UNAUTHORIZED", "Chave de API inválida.");
    let raw: unknown = {};
    if (request.method === "GET") raw = Object.fromEntries(new URL(request.url).searchParams);
    else {
      try {
        raw = await request.json();
      } catch {
        throw new MemoryHttpError(400, "INVALID_JSON", "JSON inválido.");
      }
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return json({ error: { code: "INVALID_INPUT", message: "Entrada inválida.", issues: parsed.error.flatten() } }, 400);
    return json(await handler(parsed.data, { ...memoryDeps(), startedAt }));
  } catch (error) {
    if (error instanceof MemoryHttpError) return json({ error: { code: error.code, message: error.message } }, error.status);
    console.error("[memory]", error);
    return json({ error: { code: "INTERNAL", message: "Falha no serviço de memória." } }, 500);
  }
}

/** Métricas nunca derrubam a resposta principal. */
export async function safeRecord(store: KnowledgeStore, run: Parameters<KnowledgeStore["recordRun"]>[0]) {
  try {
    await store.recordRun(run);
  } catch (error) {
    console.error("[memory] falha ao registrar execução", error);
  }
}
