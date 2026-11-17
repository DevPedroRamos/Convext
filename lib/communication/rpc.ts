import { CommunicationError } from "@/lib/communication/errors";
import type { CommunicationErrorCode } from "@/types/communication";

export type RpcEnvelope = {
  ok: boolean;
  data?: unknown;
  code?: string;
  message?: string;
  retryable?: boolean;
};

export type CommunicationClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => unknown;
      is: (column: string, value: unknown) => unknown;
      in: (column: string, value: unknown[]) => unknown;
      order: (column: string, options?: { ascending: boolean }) => unknown;
      limit: (n: number) => unknown;
      maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
    };
  };
};

export function unwrapRpc<T>(payload: unknown): T {
  const envelope = payload as RpcEnvelope | null;
  if (!envelope || typeof envelope !== "object") {
    throw new CommunicationError("ACTION_DENIED", "Resposta inválida do servidor.", true);
  }
  if (!envelope.ok) {
    throw new CommunicationError(
      (envelope.code as CommunicationErrorCode) || "ACTION_DENIED",
      envelope.message || "Operação recusada.",
      Boolean(envelope.retryable),
    );
  }
  return envelope.data as T;
}

export async function callRpc<T>(client: { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }, fn: string, args: Record<string, unknown> = {}) {
  const { data, error } = await (client as { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> }).rpc(fn, args);
  if (error) {
    const message = error.message || "";
    try {
      const parsed = JSON.parse(message) as RpcEnvelope;
      if (parsed && parsed.ok === false) {
        throw new CommunicationError(
          (parsed.code as CommunicationErrorCode) || "ACTION_DENIED",
          parsed.message || message,
          Boolean(parsed.retryable),
        );
      }
    } catch (caught) {
      if (caught instanceof CommunicationError) throw caught;
    }
    if (message.includes("AUTH_REQUIRED")) {
      throw new CommunicationError("AUTH_REQUIRED", "Autenticação necessária.");
    }
    throw new CommunicationError("ACTION_DENIED", message || "Falha na operação.", true);
  }
  return unwrapRpc<T>(data);
}

export async function hashBody(body: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
