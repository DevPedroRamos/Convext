import { runCommunication } from "@/app/api/communication/_guard";
import { archiveRoom } from "@/lib/communication/rooms";
import { archiveRoomSchema } from "@/lib/validations/communication";
import { CommunicationError } from "@/lib/communication/errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runCommunication(request, async (ctx) => {
    const parsed = archiveRoomSchema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Dados inválidos.");
    await archiveRoom(ctx.supabase, id, parsed.data.expectedVersion);
    return { ok: true };
  }, { mutate: true });
}
