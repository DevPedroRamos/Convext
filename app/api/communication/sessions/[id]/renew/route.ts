import { runCommunication } from "@/app/api/communication/_guard";
import { renewSession } from "@/lib/communication/sessions";
import { participationSchema } from "@/lib/validations/communication";
import { CommunicationError } from "@/lib/communication/errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runCommunication(request, async (ctx) => {
    const parsed = participationSchema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Dados inválidos.");
    return renewSession(ctx.supabase, ctx.user.id, id, parsed.data.participationId, parsed.data.generation);
  }, { mutate: true });
}
