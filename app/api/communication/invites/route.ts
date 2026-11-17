import { runCommunication } from "@/app/api/communication/_guard";
import { listRoomInvites } from "@/lib/communication/rooms";

export async function GET(request: Request) {
  return runCommunication(request, async (ctx) => ({ invites: await listRoomInvites(ctx.supabase, ctx.user.id) }));
}
