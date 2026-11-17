import { runCommunication } from "@/app/api/communication/_guard";
import { listNotifications } from "@/lib/communication/notifications";

export async function GET(request: Request) {
  return runCommunication(request, async (ctx) => ({ notifications: await listNotifications(ctx.supabase, ctx.user.id) }));
}
