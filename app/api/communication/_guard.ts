import { communicationContext, ensureAdmission, rateLimit, withIdempotency } from "@/lib/communication/http";
import { CommunicationError, fromUnknown, jsonError, jsonOk } from "@/lib/communication/errors";

export async function runCommunication(
  request: Request,
  handler: (ctx: Exclude<Awaited<ReturnType<typeof communicationContext>>, { error: Response }> & { supabase: any; user: { id: string } }) => Promise<unknown>,
  options: { mutate?: boolean; idempotency?: string; status?: number } = {},
) {
  const ctx = await communicationContext(request);
  if (ctx.error) return ctx.error;
  try {
    rateLimit(`${ctx.user!.id}:${request.method}:${new URL(request.url).pathname}`, ctx.requestId);
    const bodyText = options.mutate ? await request.clone().text() : "";
    if (options.mutate && options.idempotency) {
      const parsed = bodyText ? JSON.parse(bodyText) : {};
      ensureAdmission(ctx.requestId);
      const data = await withIdempotency(ctx.supabase as never, options.idempotency, request, bodyText, () => handler({ ...ctx, body: parsed } as any));
      return jsonOk(data, options.status ?? 200);
    }
    const body = options.mutate && bodyText ? JSON.parse(bodyText) : undefined;
    const data = await handler({ ...ctx, body } as any);
    return jsonOk(data, options.status ?? 200);
  } catch (error) {
    if (error instanceof SyntaxError) return jsonError("INVALID_INPUT", "JSON inválido.", ctx.requestId);
    return fromUnknown(error, ctx.requestId);
  }
}

export { CommunicationError };
