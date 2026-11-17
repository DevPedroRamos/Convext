import { jsonError, jsonOk, requestIdFrom } from "@/lib/communication/errors";
import { reconcileSecret } from "@/lib/communication/config";
import { reconcile } from "@/lib/communication/reconciliation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const secret = reconcileSecret();
  const header = request.headers.get("authorization") || "";
  if (!secret || header !== `Bearer ${secret}`) {
    return jsonError("AUTH_REQUIRED", "Não autorizado.", requestId);
  }
  await reconcile(createAdminClient() as any);
  return jsonOk({ ok: true });
}
