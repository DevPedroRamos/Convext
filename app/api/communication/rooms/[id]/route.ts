import { runCommunication } from "@/app/api/communication/_guard";
import { getRoom, updateRoom } from "@/lib/communication/rooms";
import { updateRoomSchema } from "@/lib/validations/communication";
import { CommunicationError } from "@/lib/communication/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  return runCommunication(request, async (ctx) => ({ room: await getRoom(ctx.supabase, ctx.user.id, id) }));
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  return runCommunication(request, async (ctx) => {
    const parsed = updateRoomSchema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Dados inválidos.");
    return { room: await updateRoom(ctx.supabase, id, parsed.data) };
  }, { mutate: true });
}
