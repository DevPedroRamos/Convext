import { runCommunication } from "@/app/api/communication/_guard";
import { cancelCall } from "@/lib/communication/invitations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runCommunication(request, async (ctx) => {
    await cancelCall(ctx.supabase, id);
    return { ok: true };
  }, { mutate: true });
}
