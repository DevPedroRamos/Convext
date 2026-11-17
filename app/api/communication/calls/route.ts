import { runCommunication } from "@/app/api/communication/_guard";
import { createCall } from "@/lib/communication/invitations";
import { inviteesSchema } from "@/lib/validations/communication";
import { CommunicationError } from "@/lib/communication/errors";

export async function POST(request: Request) {
  return runCommunication(request, async (ctx) => {
    const parsed = inviteesSchema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Escolha ao menos uma pessoa.");
    return createCall(ctx.supabase, parsed.data.inviteeIds);
  }, { mutate: true, idempotency: "create-call", status: 201 });
}
