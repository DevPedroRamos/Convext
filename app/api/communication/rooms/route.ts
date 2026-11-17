import { runCommunication } from "@/app/api/communication/_guard";
import { createRoom, listRooms } from "@/lib/communication/rooms";
import { createRoomSchema } from "@/lib/validations/communication";
import { CommunicationError } from "@/lib/communication/errors";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") || "";
  return runCommunication(request, async (ctx) => {
    const rooms = await listRooms(ctx.supabase, ctx.user.id, query);
    return { rooms };
  });
}

export async function POST(request: Request) {
  return runCommunication(request, async (ctx) => {
    const parsed = createRoomSchema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Dados inválidos.");
    const room = await createRoom(ctx.supabase, parsed.data);
    return { room };
  }, { mutate: true, idempotency: "create-room", status: 201 });
}
