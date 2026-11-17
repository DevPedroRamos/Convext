import { runCommunication } from "@/app/api/communication/_guard";
import { joinSession } from "@/lib/communication/sessions";
import { joinSchema } from "@/lib/validations/communication";
import { CommunicationError } from "@/lib/communication/errors";

export async function POST(request: Request) {
  return runCommunication(request, async (ctx) => {
    const parsed = joinSchema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Dados de entrada inválidos.");
    return joinSession(ctx.supabase, ctx.user.id, parsed.data);
  }, { mutate: true, idempotency: "join" });
}
