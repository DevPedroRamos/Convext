import { runCommunication } from "@/app/api/communication/_guard";
import { moderateSession } from "@/lib/communication/sessions";
import { moderationSchema } from "@/lib/validations/communication";
import { CommunicationError } from "@/lib/communication/errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runCommunication(request, async (ctx) => {
    const parsed = moderationSchema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Dados inválidos.");
    return moderateSession(ctx.supabase, id, parsed.data.targetUserId, parsed.data.action, parsed.data.source);
  }, { mutate: true });
}
