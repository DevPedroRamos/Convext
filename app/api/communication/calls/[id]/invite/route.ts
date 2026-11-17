import { runCommunication } from "@/app/api/communication/_guard";
import { inviteToCall } from "@/lib/communication/invitations";
import { inviteesSchema } from "@/lib/validations/communication";
import { CommunicationError } from "@/lib/communication/errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runCommunication(request, async (ctx) => {
    const parsed = inviteesSchema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Dados inválidos.");
    await inviteToCall(ctx.supabase, id, parsed.data.inviteeIds);
    return { ok: true };
  }, { mutate: true });
}
