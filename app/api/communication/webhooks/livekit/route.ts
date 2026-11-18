import { jsonError, jsonOk, requestIdFrom } from "@/lib/communication/errors";
import { verifyLiveKitWebhook } from "@/lib/communication/livekit";
import { handleProviderEvent } from "@/lib/communication/reconciliation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const raw = await request.text();
  try {
    const event = await verifyLiveKitWebhook(raw, request.headers.get("authorization"));
    const admin = createAdminClient();
    const result = await handleProviderEvent(admin as unknown as Parameters<typeof handleProviderEvent>[0], event as {
      id?: string;
      event?: string;
      room?: { name?: string };
      participant?: { identity?: string };
    });
    return jsonOk(result);
  } catch {
    return jsonError("ACTION_DENIED", "Webhook inválido.", requestId);
  }
}
