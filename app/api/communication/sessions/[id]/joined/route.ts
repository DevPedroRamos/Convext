import { runCommunication } from "@/app/api/communication/_guard";
import { markJoined } from "@/lib/communication/sessions";
import { participationSchema } from "@/lib/validations/communication";
import { CommunicationError } from "@/lib/communication/errors";
import { z } from "zod";

const schema = participationSchema.extend({ connectionId: z.string().min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await params;
  return runCommunication(request, async (ctx) => {
    const parsed = schema.safeParse((ctx as { body?: unknown }).body);
    if (!parsed.success) throw new CommunicationError("INVALID_INPUT", "Dados inválidos.");
    await markJoined(ctx.supabase, parsed.data.participationId, parsed.data.generation, parsed.data.connectionId);
    return { ok: true };
  }, { mutate: true });
}
