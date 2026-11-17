import { runCommunication } from "@/app/api/communication/_guard";
import { endSession } from "@/lib/communication/sessions";
import { endSessionSchema } from "@/lib/validations/communication";
import { CommunicationError } from "@/lib/communication/errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runCommunication(request, async (ctx) => {
    const parsed = endSessionSchema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Dados inválidos.");
    return endSession(ctx.supabase, id, parsed.data.expectedVersion);
  }, { mutate: true });
}
