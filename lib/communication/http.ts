import { createHash } from "node:crypto";
import { admissionEnabled, appOrigin } from "@/lib/communication/config";
import { CommunicationError, jsonError, requestIdFrom } from "@/lib/communication/errors";
import { callRpc, hashBody } from "@/lib/communication/rpc";
import { requireAreaAccess } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export async function communicationContext(request: Request) {
  const requestId = requestIdFrom(request);
  const origin = request.headers.get("origin");
  if (origin && origin !== appOrigin() && !origin.startsWith("http://localhost")) {
    return { requestId, error: jsonError("ACTION_DENIED", "Origem não autorizada.", requestId) };
  }
  const access = await requireAreaAccess("salas");
  if (access.response) {
    const status = access.response.status;
    const code = status === 401 ? "AUTH_REQUIRED" : "ACTION_DENIED";
    return { requestId, error: jsonError(code, status === 401 ? "Autenticação necessária." : "Sem permissão para esta área.", requestId) };
  }
  const supabase = await createClient();
  return { requestId, supabase, user: access.user, profile: access.profile, error: null as null };
}

export function ensureAdmission(requestId: string) {
  if (!admissionEnabled()) {
    throw new CommunicationError("ACTION_DENIED", "Novas entradas estão desligadas.");
  }
}

export function rateLimit(key: string, requestId: string, limit = 40) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new CommunicationError("RATE_LIMITED", "Muitas tentativas. Aguarde um momento.", true);
  }
}

export async function withIdempotency<T>(
  supabase: { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> } | never,
  operation: string,
  request: Request,
  bodyText: string,
  execute: () => Promise<T>,
) {
  const key = request.headers.get("idempotency-key");
  if (!key) throw new CommunicationError("INVALID_INPUT", "Idempotency-Key é obrigatória.");
  const bodyHash = await hashBody(bodyText);
  const runner = { rpc: (fn: string, args?: Record<string, unknown>) => (supabase as { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }).rpc(fn, args) };
  const began = await callRpc<{ replay: boolean; response?: T; id?: string }>(runner, "communication_begin_idempotency", {
    p_operation: operation,
    p_key: key,
    p_body_hash: bodyHash,
  });
  if (began.replay) return began.response as T;
  const result = await execute();
  if (began.id) {
    await callRpc(runner, "communication_complete_idempotency", { p_id: began.id, p_response: result as never });
  }
  return result;
}

export function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
