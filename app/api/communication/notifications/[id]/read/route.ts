import { runCommunication } from "@/app/api/communication/_guard";
import { readNotification } from "@/lib/communication/notifications";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runCommunication(request, async (ctx) => {
    await readNotification(ctx.supabase, id);
    return { ok: true };
  }, { mutate: true });
}
