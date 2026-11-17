import { runCommunication } from "@/app/api/communication/_guard";
import { transferRoom } from "@/lib/communication/rooms";
import { transferSchema } from "@/lib/validations/communication";
import { CommunicationError } from "@/lib/communication/errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runCommunication(request, async (ctx) => {
    const parsed = transferSchema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Dados inválidos.");
    await transferRoom(ctx.supabase, id, parsed.data.newOwnerId);
    return { ok: true };
  }, { mutate: true });
}
