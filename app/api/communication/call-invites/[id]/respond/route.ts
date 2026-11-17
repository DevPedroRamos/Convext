import { runCommunication } from "@/app/api/communication/_guard";
import { respondCallInvite } from "@/lib/communication/invitations";
import { respondSchema } from "@/lib/validations/communication";
import { CommunicationError } from "@/lib/communication/errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runCommunication(request, async (ctx) => {
    const parsed = respondSchema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Dados inválidos.");
    return respondCallInvite(ctx.supabase, id, parsed.data.action === "accept");
  }, { mutate: true, idempotency: "call-invite-respond" });
}
