"use client";

import { toast } from "sonner";

/** Chama /api/spaces|notifications e mostra o erro em toast. Devolve `data` ou null. */
export async function spacesRequest<T = unknown>(url: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown, success?: string): Promise<T | null> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => null);
  if (!response) {
    toast.error("Sem conexão com o servidor.");
    return null;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    toast.error(payload.error || "Não foi possível concluir a ação.");
    return null;
  }
  if (success) toast.success(success);
  return (payload.data ?? true) as T;
}
