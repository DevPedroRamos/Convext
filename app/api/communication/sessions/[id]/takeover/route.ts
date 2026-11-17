import { runCommunication } from "@/app/api/communication/_guard";
import { joinSession } from "@/lib/communication/sessions";
import { takeoverSchema } from "@/lib/validations/communication";
import { CommunicationError } from "@/lib/communication/errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runCommunication(request, async (ctx) => {
    const parsed = takeoverSchema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Dados inválidos.");
    return joinSession(ctx.supabase, ctx.user.id, { ...parsed.data, sessionId: parsed.data.sessionId || id, takeover: true });
  }, { mutate: true, idempotency: "takeover" });
}
