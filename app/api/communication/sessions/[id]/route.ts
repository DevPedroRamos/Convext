import { runCommunication } from "@/app/api/communication/_guard";
import { getSession } from "@/lib/communication/sessions";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return runCommunication(request, async (ctx) => ({ session: await getSession(ctx.supabase, id) }));
}
